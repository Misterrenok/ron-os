import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createStore as createBaseStore, requestHash } from './store-v2.mjs';
import {
  awardActionForCompletion,
  normalizeQuestResolution,
  prepareQuestResolution,
  resolutionChildKeys
} from './quest-resolution.mjs';

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

function resolutionResult(events, questId, replay) {
  const ordered = [...events].sort((a, b) => Number(a.seq) - Number(b.seq));
  const completion = ordered.find((event) => event.event_type === 'quest.completed');
  if (!completion) throw new Error('quest.resolve replay is missing its completion event');
  const award = ordered.find((event) => event.event_type === 'progression.awarded') ?? null;
  return {
    replay,
    event: completion,
    events: ordered,
    resolution: {
      quest_id: questId,
      completion_event_id: completion.event_id,
      award_event_id: award?.event_id ?? null,
      rewarded: Boolean(award)
    }
  };
}

function isDifficultyScoredQuest(action, context) {
  const payload = action?.payload;
  return action?.type === 'quest.create'
    && payload?.quest_version === 2
    && payload?.reward_xp != null
    && payload?.reward_coins != null
    && typeof context?.sourceRef === 'string'
    && context.sourceRef.startsWith('system-quest-difficulty:v1');
}

class ResolutionStore {
  #base;
  #memoryTail = Promise.resolve();
  #memoryResolutionHashes = new Map();

  constructor(base) {
    this.#base = base;
    this.pool = base.pool ?? null;
  }

  async init() {
    await this.#base.init();
    if (this.pool) {
      const migrationPath = fileURLToPath(new URL('../migrations/008_outcome_key_v1.sql', import.meta.url));
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
  async close() { return this.#base.close(); }

  async applyAction(action, context, idempotencyKey) {
    if (action?.type !== 'quest.resolve') {
      if (this.pool && isDifficultyScoredQuest(action, context)) {
        return this.#applyPostgresScoredQuest(action, context, idempotencyKey);
      }
      if (this.pool) return this.#base.applyAction(action, context, idempotencyKey);
      return this.#serializeMemory(() => this.#base.applyAction(action, context, idempotencyKey));
    }
    if (this.pool) return this.#applyPostgresResolution(action, context, idempotencyKey);
    return this.#serializeMemory(() => this.#applyMemoryResolution(action, context, idempotencyKey));
  }

  async #serializeMemory(work) {
    const previous = this.#memoryTail;
    let release;
    this.#memoryTail = new Promise((resolve) => { release = resolve; });
    await previous;
    try {
      return await work();
    } finally {
      release();
    }
  }

  async #applyPostgresScoredQuest(action, context, idempotencyKey) {
    const hash = requestHash(action, context);
    const { rows } = await this.pool.query(
      'SELECT replay, event FROM system_apply_scored_quest_v1($1::jsonb,$2,$3,$4,$5,$6)',
      [JSON.stringify(action), context.actor, context.source, context.sourceRef, idempotencyKey, hash]
    );
    if (rows.length !== 1 || !rows[0].event) throw new Error('system_apply_scored_quest_v1 returned no event');
    return {
      replay: Boolean(rows[0].replay),
      event: normalizedRecord(rows[0].event)
    };
  }

  async #collectBaseEvents(keys) {
    const events = [];
    for (const key of [...keys.progress, keys.completion, keys.reward]) {
      const event = await this.#base.getByIdempotencyKey(key);
      if (event) events.push(event);
    }
    return events;
  }

  async #applyMemoryResolution(action, context, idempotencyKey) {
    const normalized = normalizeQuestResolution(action);
    const keys = resolutionChildKeys(idempotencyKey, normalized.progress.length);
    const rootHash = requestHash(action, context);
    const existingRoot = await this.#base.getByIdempotencyKey(idempotencyKey);
    if (existingRoot) {
      if (this.#memoryResolutionHashes.get(idempotencyKey) !== rootHash) throw idempotencyConflict();
      return resolutionResult(await this.#collectBaseEvents(keys), normalized.quest_id, true);
    }

    for (const key of [...keys.progress.slice(1), keys.completion, keys.reward]) {
      if (key === idempotencyKey) continue;
      if (await this.#base.getByIdempotencyKey(key)) throw idempotencyConflict();
    }

    const events = await this.#base.listAllEvents();
    const plan = prepareQuestResolution(events, action, context);
    const written = [];
    for (let index = 0; index < plan.progressActions.length; index += 1) {
      const result = await this.#base.applyAction(plan.progressActions[index], context, keys.progress[index]);
      written.push(result.event);
    }
    const completed = await this.#base.applyAction(plan.completionAction, context, keys.completion);
    written.push(completed.event);
    const awardAction = awardActionForCompletion(plan, completed.event.event_id);
    if (awardAction) {
      const awarded = await this.#base.applyAction(awardAction, context, keys.reward);
      written.push(awarded.event);
    }
    this.#memoryResolutionHashes.set(idempotencyKey, rootHash);
    return resolutionResult(written, normalized.quest_id, false);
  }

  async #applyPostgresResolution(action, context, idempotencyKey) {
    const normalized = normalizeQuestResolution(action);
    const keys = resolutionChildKeys(idempotencyKey, normalized.progress.length);
    const rootHash = requestHash(action, context);
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [idempotencyKey]);

      const rootLookup = await client.query('SELECT * FROM system_events WHERE idempotency_key=$1', [idempotencyKey]);
      if (rootLookup.rows[0]) {
        const existingRoot = normalizedRecord(rootLookup.rows[0]);
        if (existingRoot.request_hash !== rootHash) throw idempotencyConflict();
        const allKeys = [...keys.progress, keys.completion, keys.reward];
        const { rows } = await client.query(
          'SELECT * FROM system_events WHERE idempotency_key = ANY($1::text[]) ORDER BY seq ASC',
          [allKeys]
        );
        await client.query('COMMIT');
        return resolutionResult(rows.map(normalizedRecord), normalized.quest_id, true);
      }

      const derivedKeys = [...keys.progress.slice(1), keys.completion, keys.reward].filter((key) => key !== idempotencyKey);
      if (derivedKeys.length) {
        const collision = await client.query('SELECT 1 FROM system_events WHERE idempotency_key = ANY($1::text[]) LIMIT 1', [derivedKeys]);
        if (collision.rows.length) throw idempotencyConflict();
      }

      const historyQuery = await client.query('SELECT * FROM system_events ORDER BY seq ASC');
      const history = historyQuery.rows.map(normalizedRecord);
      const plan = prepareQuestResolution(history, action, context);
      const written = [];

      const callChild = async (childAction, key) => {
        const { rows } = await client.query(
          'SELECT replay, event FROM system_apply_action($1::jsonb,$2,$3,$4,$5,$6)',
          [JSON.stringify(childAction), context.actor, context.source, context.sourceRef, key, rootHash]
        );
        if (rows.length !== 1 || !rows[0].event) throw new Error('system_apply_action returned no event');
        if (rows[0].replay) throw new Error('unexpected child replay during new quest.resolve transaction');
        return normalizedRecord(rows[0].event);
      };

      for (let index = 0; index < plan.progressActions.length; index += 1) {
        written.push(await callChild(plan.progressActions[index], keys.progress[index]));
      }
      const completion = await callChild(plan.completionAction, keys.completion);
      written.push(completion);
      const awardAction = awardActionForCompletion(plan, completion.event_id);
      if (awardAction) written.push(await callChild(awardAction, keys.reward));

      await client.query('COMMIT');
      return resolutionResult(written, normalized.quest_id, false);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export function wrapStore(baseStore) {
  return new ResolutionStore(baseStore);
}

export async function createStore() {
  return wrapStore(await createBaseStore());
}
