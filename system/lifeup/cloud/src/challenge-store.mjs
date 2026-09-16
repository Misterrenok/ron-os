import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createStore as createResolutionStore } from './resolution-store.mjs';
import { requestHash } from './store-v2.mjs';
import {
  CHALLENGE_POLICY_REF,
  normalizeChallengeCreate,
  normalizeContractId
} from './challenge-contract.mjs';

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

function challengeCreateResult(events, normalized, replay) {
  const ordered = [...events].sort((a, b) => Number(a.seq) - Number(b.seq));
  const declaration = ordered.find((event) => event.event_type === 'challenge.declared' && event.payload?.contract_id === normalized.contract.contract_id);
  const quest = ordered.find((event) => event.event_type === 'quest.created' && event.payload?.quest_id === normalized.quest.quest_id);
  if (!declaration || !quest) throw new Error('challenge.create result is incomplete');
  return {
    replay,
    event: quest,
    events: ordered,
    challenge: {
      contract_id: normalized.contract.contract_id,
      quest_id: normalized.quest.quest_id,
      declaration_event_id: declaration.event_id,
      quest_event_id: quest.event_id
    }
  };
}

function challengeExpiryResult(events, questId, contractId, replay) {
  const ordered = [...events].sort((a, b) => Number(a.seq) - Number(b.seq));
  const expired = ordered.find((event) => event.event_type === 'quest.expired' && event.payload?.quest_id === questId);
  const recovery = ordered.find((event) => event.event_type === 'quest.created' && event.payload?.quest_id === `challenge-recovery:${contractId}`);
  if (!expired || !recovery) throw new Error('Challenge expiry result is incomplete');
  return {
    replay,
    event: expired,
    events: ordered,
    recovery_quest_id: recovery.payload.quest_id
  };
}

function atomicGateRequired() {
  const error = new Error('Challenge Contract v1 requires PostgreSQL atomic action gate');
  error.code = 'CHALLENGE_ATOMIC_GATE_REQUIRED';
  return error;
}

class ChallengeStore {
  #base;

  constructor(base) {
    this.#base = base;
    this.pool = base.pool ?? null;
  }

  get challengeWritesAtomic() { return Boolean(this.pool); }

  async init() {
    await this.#base.init();
    if (this.pool) {
      const migrationPaths = [
        new URL('../migrations/012_challenge_contract_v1.sql', import.meta.url),
        new URL('../migrations/013_challenge_timing_bridge_v1.sql', import.meta.url)
      ].map(fileURLToPath);
      for (const migrationPath of migrationPaths) {
        await this.pool.query(await fs.readFile(migrationPath, 'utf8'));
      }
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
    if (action?.type === 'challenge.declare') throw new Error('challenge.declare is internal; use challenge.create');
    if (action?.type !== 'challenge.create') return this.#base.applyAction(action, context, idempotencyKey);
    if (!this.pool) throw atomicGateRequired();
    return this.#applyPostgresChallenge(action, context, idempotencyKey);
  }

  async expireChallenge({ quest_id: questId, contract_id: contractId }, context, idempotencyKey) {
    const normalizedContractId = normalizeContractId(contractId);
    if (typeof questId !== 'string' || !questId.trim() || questId.trim().length > 100) throw new Error('Challenge quest_id is invalid');
    if (!this.pool) throw atomicGateRequired();
    return this.#expirePostgresChallenge(questId.trim(), normalizedContractId, context, idempotencyKey);
  }

  async #applyPostgresChallenge(action, context, idempotencyKey) {
    const normalized = normalizeChallengeCreate(action);
    const hash = requestHash(action, context);
    const { rows } = await this.pool.query(
      'SELECT replay, events FROM system_apply_challenge_v1($1::jsonb,$2,$3,$4,$5,$6)',
      [JSON.stringify(action), context.actor, context.source, context.sourceRef, idempotencyKey, hash]
    );
    if (rows.length !== 1 || !Array.isArray(rows[0].events)) throw new Error('system_apply_challenge_v1 returned no events');
    return challengeCreateResult(rows[0].events.map(normalizedRecord), normalized, Boolean(rows[0].replay));
  }

  async #expirePostgresChallenge(questId, contractId, context, idempotencyKey) {
    const syntheticAction = { type: 'challenge.expire', payload: { quest_id: questId, contract_id: contractId } };
    const hash = requestHash(syntheticAction, context);
    const { rows } = await this.pool.query(
      'SELECT replay, events FROM system_expire_challenge_v1($1,$2,$3,$4,$5,$6,$7)',
      [questId, contractId, context.actor, context.source, context.sourceRef ?? CHALLENGE_POLICY_REF, idempotencyKey, hash]
    );
    if (rows.length !== 1 || !Array.isArray(rows[0].events)) throw new Error('system_expire_challenge_v1 returned no events');
    return challengeExpiryResult(rows[0].events.map(normalizedRecord), questId, contractId, Boolean(rows[0].replay));
  }
}

export function wrapStore(baseStore) {
  return new ChallengeStore(baseStore);
}

export async function createStore() {
  return wrapStore(await createResolutionStore());
}
