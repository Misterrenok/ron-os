import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createStore as createChallengeStore } from './challenge-store.mjs';
import { requestHash } from './store-v2.mjs';
import { EXECUTION_REMINDER_POLICY_REF } from './execution-reminder.mjs';

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

function postgresRequired() {
  const error = new Error('Execution Reminder v1 requires PostgreSQL event-ledger persistence');
  error.code = 'EXECUTION_REMINDER_POSTGRES_REQUIRED';
  return error;
}

class ExecutionReminderStore {
  #base;
  constructor(base) {
    this.#base = base;
    this.pool = base.pool ?? null;
  }

  get challengeWritesAtomic() { return this.#base.challengeWritesAtomic; }
  get executionReminderWritesAtomic() { return Boolean(this.pool); }

  async init() {
    await this.#base.init();
    if (this.pool) {
      const migrationPath = fileURLToPath(new URL('../migrations/014_execution_reminder_v1.sql', import.meta.url));
      await this.pool.query(await fs.readFile(migrationPath, 'utf8'));
    }
  }

  async getByIdempotencyKey(key) { return this.#base.getByIdempotencyKey(key); }
  async listAllEvents() { return this.#base.listAllEvents(); }
  async listEvents(limit = 1000) { return this.#base.listEvents(limit); }
  async upsertPushSubscription(input) { return this.#base.upsertPushSubscription(input); }
  async deletePushSubscription(endpoint) { return this.#base.deletePushSubscription(endpoint); }
  async enqueuePushDeliveries() { return this.#base.enqueuePushDeliveries(); }
  async claimPushDeliveries(limit = 20) { return this.#base.claimPushDeliveries(limit); }
  async finishPushDelivery(claim, outcome) { return this.#base.finishPushDelivery(claim, outcome); }
  async expireChallenge(input, context, idempotencyKey) { return this.#base.expireChallenge(input, context, idempotencyKey); }
  async close() { return this.#base.close(); }

  async applyAction(action, context, idempotencyKey) {
    if (action?.type !== 'reminder.schedule') return this.#base.applyAction(action, context, idempotencyKey);
    if (!this.pool) throw postgresRequired();
    const hash = requestHash(action, context);
    const { rows } = await this.pool.query(
      'SELECT replay, event FROM system_schedule_execution_reminder_v1($1::jsonb,$2,$3,$4,$5,$6)',
      [JSON.stringify(action), context.actor, context.source, context.sourceRef ?? EXECUTION_REMINDER_POLICY_REF, idempotencyKey, hash]
    );
    if (rows.length !== 1 || !rows[0].event) throw new Error('system_schedule_execution_reminder_v1 returned no event');
    return { replay: Boolean(rows[0].replay), event: normalizedRecord(rows[0].event) };
  }
}

export function wrapStore(base) { return new ExecutionReminderStore(base); }

export async function createStore() {
  return wrapStore(await createChallengeStore());
}
