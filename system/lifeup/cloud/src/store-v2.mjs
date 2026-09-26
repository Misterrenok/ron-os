import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { validateCalibrationEventAgainstHistory } from './calibration.mjs';
import { actionToEvent, validateEventAgainstHistory } from './quest-v2.mjs';

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

function subscriptionHash(endpoint) {
  return createHash('sha256').update(endpoint).digest('hex');
}

export function normalizePushSubscription(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('push subscription must be an object');
  const endpoint = typeof input.endpoint === 'string' ? input.endpoint.trim() : '';
  const p256dh = typeof input.keys?.p256dh === 'string' ? input.keys.p256dh.trim() : '';
  const auth = typeof input.keys?.auth === 'string' ? input.keys.auth.trim() : '';
  let parsed;
  try { parsed = new URL(endpoint); } catch { throw new Error('push subscription endpoint is invalid'); }
  if (parsed.protocol !== 'https:' || endpoint.length > 4096) throw new Error('push subscription endpoint must be HTTPS');
  if (!p256dh || p256dh.length > 512 || !auth || auth.length > 512) throw new Error('push subscription keys are invalid');
  return { subscription_hash: subscriptionHash(endpoint), endpoint, p256dh, auth };
}

export function pushPayload(event) {
  const notificationId = event.payload?.notification_id || null;
  const severity = event.payload?.severity || 'INFO';
  const kind = event.payload?.kind || 'SYSTEM';
  const params = new URLSearchParams({ view: 'notifications' });
  if (notificationId) params.set('notification', notificationId);
  if (['REWARD', 'ACHIEVEMENT'].includes(String(kind).toUpperCase()) || String(severity).toUpperCase() === 'SUCCESS') {
    params.set('celebrate', '1');
  }
  return {
    title: event.payload?.title || 'System',
    body: event.payload?.body || '',
    severity,
    kind,
    notification_id: notificationId,
    url: `/?${params.toString()}`
  };
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
  #subscriptions = new Map();
  #deliveries = new Map();

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
    validateCalibrationEventAgainstHistory(event, this.#events);
    return this.#appendEvent(event, idempotencyKey, hash);
  }

  async upsertPushSubscription(input) {
    const subscription = normalizePushSubscription(input);
    this.#subscriptions.set(subscription.subscription_hash, subscription);
    return { subscription_hash: subscription.subscription_hash };
  }

  async deletePushSubscription(endpoint) {
    if (typeof endpoint !== 'string' || !endpoint.trim()) throw new Error('push subscription endpoint is required');
    const hash = subscriptionHash(endpoint.trim());
    this.#subscriptions.delete(hash);
    for (const key of this.#deliveries.keys()) if (key.endsWith(`:${hash}`)) this.#deliveries.delete(key);
  }

  async enqueuePushDeliveries() {
    for (const event of this.#events.filter((item) => item.event_type === 'notification.pushed')) {
      for (const subscription of this.#subscriptions.values()) {
        const key = `${event.event_id}:${subscription.subscription_hash}`;
        if (!this.#deliveries.has(key)) this.#deliveries.set(key, { key, event, subscription, status: 'PENDING', attempts: 0 });
      }
    }
  }

  async claimPushDeliveries(limit = 20) {
    const claims = [];
    for (const delivery of this.#deliveries.values()) {
      if (!['PENDING', 'RETRY'].includes(delivery.status) || claims.length >= limit) continue;
      delivery.status = 'PROCESSING';
      delivery.attempts += 1;
      claims.push({
        notification_event_id: delivery.event.event_id,
        subscription_hash: delivery.subscription.subscription_hash,
        endpoint: delivery.subscription.endpoint,
        p256dh: delivery.subscription.p256dh,
        auth: delivery.subscription.auth,
        topic: `system-${String(delivery.event.event_id).replace(/-/g, '').slice(0, 24)}`,
        payload: pushPayload(delivery.event)
      });
    }
    return claims;
  }

  async finishPushDelivery(claim, outcome) {
    const delivery = this.#deliveries.get(`${claim.notification_event_id}:${claim.subscription_hash}`);
    if (!delivery) return;
    if (outcome.sent) delivery.status = 'SENT';
    else if (outcome.gone || delivery.attempts >= 5) {
      delivery.status = 'DEAD';
      if (outcome.gone) this.#subscriptions.delete(claim.subscription_hash);
    } else delivery.status = 'RETRY';
  }

  async close() {}
}

class PostgresStore {
  constructor(pool) { this.pool = pool; }

  async init() {
    const paths = [
      new URL('../schema.sql', import.meta.url),
      new URL('../migrations/002_action_gate.sql', import.meta.url),
      new URL('../migrations/003_profile_domain.sql', import.meta.url),
      new URL('../migrations/004_calibration_v1.sql', import.meta.url),
      new URL('../migrations/005_quest_v2.sql', import.meta.url),
      new URL('../migrations/006_player_focus_slot.sql', import.meta.url),
      new URL('../migrations/007_deadline_push_delivery.sql', import.meta.url),
      new URL('../migrations/008_outcome_key_v1.sql', import.meta.url),
      new URL('../migrations/009_open_focus_quest_model.sql', import.meta.url),
      new URL('../migrations/010_reward_economy_v2.sql', import.meta.url)
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

  async upsertPushSubscription(input) {
    const subscription = normalizePushSubscription(input);
    await this.pool.query(
      `INSERT INTO system_push_subscriptions(subscription_hash, endpoint, p256dh, auth)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (subscription_hash) DO UPDATE
       SET endpoint=EXCLUDED.endpoint, p256dh=EXCLUDED.p256dh, auth=EXCLUDED.auth,
           updated_at=clock_timestamp(), disabled_at=NULL`,
      [subscription.subscription_hash, subscription.endpoint, subscription.p256dh, subscription.auth]
    );
    return { subscription_hash: subscription.subscription_hash };
  }

  async deletePushSubscription(endpoint) {
    if (typeof endpoint !== 'string' || !endpoint.trim()) throw new Error('push subscription endpoint is required');
    await this.pool.query('DELETE FROM system_push_subscriptions WHERE subscription_hash=$1', [subscriptionHash(endpoint.trim())]);
  }

  async enqueuePushDeliveries() {
    await this.pool.query(
      `INSERT INTO system_push_deliveries(notification_event_id, subscription_hash)
       SELECT e.event_id, s.subscription_hash
       FROM system_events e
       CROSS JOIN system_push_subscriptions s
       WHERE e.event_type='notification.pushed'
         AND s.disabled_at IS NULL
         AND e.occurred_at >= s.created_at
       ON CONFLICT DO NOTHING`
    );
  }

  async claimPushDeliveries(limit = 20) {
    const safeLimit = Math.max(1, Math.min(Number(limit) || 20, 100));
    const { rows } = await this.pool.query(
      `WITH picked AS (
         SELECT d.notification_event_id, d.subscription_hash
         FROM system_push_deliveries d
         WHERE (
           d.status IN ('PENDING','RETRY') AND d.next_attempt_at <= clock_timestamp()
         ) OR (
           d.status='PROCESSING' AND d.lease_until < clock_timestamp()
         )
         ORDER BY d.next_attempt_at, d.notification_event_id
         FOR UPDATE SKIP LOCKED
         LIMIT $1
       ), claimed AS (
         UPDATE system_push_deliveries d
         SET status='PROCESSING', attempts=d.attempts+1,
             lease_until=clock_timestamp()+interval '2 minutes'
         FROM picked p
         WHERE d.notification_event_id=p.notification_event_id
           AND d.subscription_hash=p.subscription_hash
         RETURNING d.notification_event_id, d.subscription_hash
       )
       SELECT c.notification_event_id, c.subscription_hash,
              s.endpoint, s.p256dh, s.auth, e.payload
       FROM claimed c
       JOIN system_push_subscriptions s USING (subscription_hash)
       JOIN system_events e ON e.event_id=c.notification_event_id`,
      [safeLimit]
    );
    return rows.map((row) => ({
      ...row,
      topic: `system-${String(row.notification_event_id).replace(/-/g, '').slice(0, 24)}`,
      payload: pushPayload({ payload: row.payload })
    }));
  }

  async finishPushDelivery(claim, outcome) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      if (outcome.sent) {
        await client.query(
          `UPDATE system_push_deliveries
           SET status='SENT', sent_at=clock_timestamp(), lease_until=NULL, last_error=NULL
           WHERE notification_event_id=$1 AND subscription_hash=$2`,
          [claim.notification_event_id, claim.subscription_hash]
        );
      } else {
        await client.query(
          `UPDATE system_push_deliveries
           SET status=CASE WHEN $3 OR attempts >= 5 THEN 'DEAD' ELSE 'RETRY' END,
               next_attempt_at=clock_timestamp() + make_interval(secs => LEAST(3600, (30 * power(2, attempts))::integer)),
               lease_until=NULL, last_error=left($4,500)
           WHERE notification_event_id=$1 AND subscription_hash=$2`,
          [claim.notification_event_id, claim.subscription_hash, Boolean(outcome.gone), outcome.error || 'push failed']
        );
        if (outcome.gone) {
          await client.query(
            'UPDATE system_push_subscriptions SET disabled_at=clock_timestamp(), updated_at=clock_timestamp() WHERE subscription_hash=$1',
            [claim.subscription_hash]
          );
        }
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
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
