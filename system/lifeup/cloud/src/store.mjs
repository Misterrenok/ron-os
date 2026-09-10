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
    payload: record.payload
  };
}

class MemoryStore {
  #events = [];
  #byKey = new Map();

  async init() {}

  async listEvents(limit = 1000) {
    return this.#events.slice(-limit).map((event) => structuredClone(event));
  }

  async appendEvent(event, idempotencyKey) {
    if (this.#byKey.has(idempotencyKey)) return { event: structuredClone(this.#byKey.get(idempotencyKey)), replay: true };
    const stored = {
      seq: this.#events.length + 1,
      ...structuredClone(event),
      occurred_at: new Date().toISOString(),
      idempotency_key: idempotencyKey
    };
    this.#events.push(stored);
    this.#byKey.set(idempotencyKey, stored);
    return { event: structuredClone(stored), replay: false };
  }

  async close() {}
}

class PostgresStore {
  constructor(pool) {
    this.pool = pool;
  }

  async init() {
    const schemaPath = fileURLToPath(new URL('../schema.sql', import.meta.url));
    const schema = await fs.readFile(schemaPath, 'utf8');
    await this.pool.query(schema);
  }

  async listEvents(limit = 1000) {
    const safeLimit = Math.max(1, Math.min(Number(limit) || 1000, 5000));
    const { rows } = await this.pool.query(
      'SELECT * FROM system_events ORDER BY seq ASC LIMIT $1',
      [safeLimit]
    );
    return rows.map(normalizedRecord);
  }

  async appendEvent(event, idempotencyKey) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const inserted = await client.query(
        `INSERT INTO system_events
          (event_id, event_type, actor, source, source_ref, claim_status, idempotency_key, payload)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)
         ON CONFLICT (idempotency_key) DO NOTHING
         RETURNING *`,
        [
          event.event_id,
          event.event_type,
          event.actor,
          event.source,
          event.source_ref,
          event.claim_status,
          idempotencyKey,
          JSON.stringify(event.payload)
        ]
      );
      if (inserted.rows.length === 1) {
        await client.query('COMMIT');
        return { event: normalizedRecord(inserted.rows[0]), replay: false };
      }
      const existing = await client.query('SELECT * FROM system_events WHERE idempotency_key = $1', [idempotencyKey]);
      await client.query('COMMIT');
      return { event: normalizedRecord(existing.rows[0]), replay: true };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async close() {
    await this.pool.end();
  }
}

export async function createStore() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (databaseUrl) {
    const { Pool } = await import('pg');
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
