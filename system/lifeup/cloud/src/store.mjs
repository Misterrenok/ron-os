import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

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

  async appendEvent(event, idempotencyKey, requestHash) {
    if (this.#byKey.has(idempotencyKey)) {
      const existing = this.#byKey.get(idempotencyKey);
      if (existing.request_hash !== requestHash) throw idempotencyConflict();
      return { event: structuredClone(existing), replay: true };
    }
    const stored = {
      seq: this.#events.length + 1,
      ...structuredClone(event),
      occurred_at: new Date().toISOString(),
      idempotency_key: idempotencyKey,
      request_hash: requestHash
    };
    this.#events.push(stored);
    this.#byKey.set(idempotencyKey, stored);
    return { event: structuredClone(stored), replay: false };
  }
  async close() {}
}

class PostgresStore {
  constructor(pool) { this.pool = pool; }

  async init() {
    const schemaPath = fileURLToPath(new URL('../schema.sql', import.meta.url));
    const schema = await fs.readFile(schemaPath, 'utf8');
    await this.pool.query(schema);
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

  async appendEvent(event, idempotencyKey, requestHash) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const inserted = await client.query(
        `INSERT INTO system_events
          (event_id, event_type, actor, source, source_ref, claim_status, idempotency_key, request_hash, payload)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)
         ON CONFLICT (idempotency_key) DO NOTHING
         RETURNING *`,
        [event.event_id, event.event_type, event.actor, event.source, event.source_ref, event.claim_status, idempotencyKey, requestHash, JSON.stringify(event.payload)]
      );
      if (inserted.rows.length === 1) {
        await client.query('COMMIT');
        return { event: normalizedRecord(inserted.rows[0]), replay: false };
      }
      const existing = await client.query('SELECT * FROM system_events WHERE idempotency_key = $1', [idempotencyKey]);
      if (existing.rows[0].request_hash !== requestHash) {
        await client.query('ROLLBACK');
        throw idempotencyConflict();
      }
      await client.query('COMMIT');
      return { event: normalizedRecord(existing.rows[0]), replay: true };
    } catch (error) {
      if (error.code !== 'IDEMPOTENCY_CONFLICT') {
        try { await client.query('ROLLBACK'); } catch {}
      }
      throw error;
    } finally {
      client.release();
    }
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
