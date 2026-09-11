import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { actionToEvent, validateEventAgainstHistory } from './model.mjs';

function normalizedRecord(record) {
  return {
    seq: Number(record.seq),
    event_id: record.event_id,
    event_type: record.event_type,
    occurred_at: new Date(record.occurred_at).toISOString(),
    actor: record.actor,
    source: record.source,
    source_ref: record.source_ref,
    claim_status: record.claim_status,
    idempotency_key: record.idempotency_key,
    request_hash: record.request_hash,
    payload: record.payload
  };
}

export function requestHash(action, context) {
  return createHash('sha256').update(JSON.stringify({ action, context })).digest('hex');
}

function idempotencyConflict() {
  const error = new Error('Idempotency-Key was already used for a different action');
  error.code = 'IDEMPOTENCY_CONFLICT';
  return error;
}

export function resolvePgPool(pgModule) {
  const pg = pgModule?.default ?? pgModule;
  const Pool = pg?.Pool ?? pgModule?.Pool;
  if (typeof Pool !== 'function') {
    throw new TypeError('pg Pool constructor is unavailable');
  }
  return Pool;
}

class MemoryStore {
  #events = [];
  #byKey = new Map();

  async init() {}
  async getByIdempotencyKey(key) { return this.#byKey.has(key) ? structuredClone(this.#byKey.get(key)) : null; }
  async listAllEvents() { return this.#events.map((event) => structuredClone(event)); }
  async listEvents(limit = 1000) { return this.#events.slice(-limit).map((event) => structuredClone(event)); }

  async #appendEvent(event, idempotencyKey, hash) {
    if (this.#byKey.has(idempotencyKey)) {
      const existing = this.#byKey.get(idempotencyKey);
      if (existing.request_hash !== hash) throw idempotencyConflict();
      return { event: structuredClone(existing), replay: true };
    }
    const stored = {
      seq: this.#events.length + 1,
      ...structuredClone(event),
      occurred_at: new Date().toISOString(),
      idempotency_key: idempotencyKey,
      request_hash: hash
    };
    this.#events.push(stored);
    this.#byKey.set(idempotencyKey, stored);
    return { event: structuredClone(stored), replay: false };
  }

  async applyAction(action, context, idempotencyKey) {
    const hash = requestHash(action, context);
    const existing = await this.getByIdempotencyKey(idempotencyKey);
    if (existing) {
      if (existing.request_hash !== hash) throw idempotencyConflict();
      return { event: existing, replay: true };
    }
    const event = actionToEvent(action, context);
    validateEventAgainstHistory(event, this.#events);
    return this.#appendEvent(event, idempotencyKey, hash);
  }

  async close() {}
}

class PostgresStore {
  constructor(pool) { this.pool = pool; }

  async init() {
    const paths = [
      new URL('../schema.sql', import.meta.url),
      new URL('../migrations/002_action_gate.sql', import.meta.url),
      new URL('../migrations/003_profile_domain.sql', import.meta.url)
    ].map(fileURLToPath);
    const migrations = await Promise.all(paths.map((filePath) => fs.readFile(filePath, 'utf8')));
    for (const migration of migrations) await this.pool.query(migration);
  }

  async getByIdempotencyKey(key) {
    const { rows } = await this.pool.query('SELECT * FROM system_events WHERE idempotency_key = $1', [key]);
    return rows[0] ? normalizedRecord(rows[0]) : null;
  }

  async listAllEvents() {
    const { rows } = await this.pool.query('SELECT * FROM system_events ORDER BY seq ASC');
    return rows.map(normalizedRecord);
  }

  async listEvents(limit = 1000) {
    const safeLimit = Math.max(1, Math.min(Number(limit) || 1000, 5000));
    const { rows } = await this.pool.query(
      'SELECT * FROM (SELECT * FROM system_events ORDER BY seq DESC LIMIT $1) recent ORDER BY seq ASC',
      [safeLimit]
    );
    return rows.map(normalizedRecord);
  }

  async applyAction(action, context, idempotencyKey) {
    const hash = requestHash(action, context);
    const { rows } = await this.pool.query(
      `SELECT replay, event
         FROM system_apply_action($1::jsonb, $2, $3, $4, $5, $6)`,
      [JSON.stringify(action), context.actor, context.source, context.sourceRef, idempotencyKey, hash]
    );
    if (rows.length !== 1 || !rows[0].event) throw new Error('system_apply_action returned no event');
    return {
      replay: Boolean(rows[0].replay),
      event: normalizedRecord(rows[0].event)
    };
  }

  async close() { await this.pool.end(); }
}

export async function createStore() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (databaseUrl) {
    const Pool = resolvePgPool(await import('pg'));
    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: process.env.PGSSL === 'disable' ? false : { rejectUnauthorized: false },
      max: Number(process.env.PGPOOL_MAX || 5)
    });
    return new PostgresStore(pool);
  }
  if (process.env.SYSTEM_ALLOW_EPHEMERAL === '1') return new MemoryStore();
  throw new Error('DATABASE_URL is required unless SYSTEM_ALLOW_EPHEMERAL=1 is explicitly set for development/tests');
}
