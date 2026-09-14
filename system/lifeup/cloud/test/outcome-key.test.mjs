import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { levelSnapshotForXp } from '../src/calibration.mjs';
import { createStore } from '../src/resolution-store.mjs';
import { buildXmindStrategySourceRef } from '../src/strategy-bridge.mjs';

const databaseUrl = process.env.TEST_DATABASE_URL?.trim();
const genericContext = {
  actor: 'chatgpt',
  source: 'outcome-key-test',
  sourceRef: 'ci:outcome-key'
};

function policyContext(sourceRef = 'system-quest-difficulty:v1:ci') {
  return {
    actor: 'chatgpt',
    source: 'outcome-key-test',
    sourceRef
  };
}

function scoredQuest(questId, outcomeKey, extra = {}) {
  const payload = {
    quest_id: questId,
    quest_version: 2,
    title: `Outcome probe ${questId}`,
    class: 'SIDE',
    rank: 'D',
    reward_xp: 10,
    reward_coins: 0,
    objectives: [],
    ...extra
  };
  if (outcomeKey != null) payload.outcome_key = outcomeKey;
  return { type: 'quest.create', payload };
}

async function postgresStore() {
  const oldDb = process.env.DATABASE_URL;
  const oldSsl = process.env.PGSSL;
  process.env.DATABASE_URL = databaseUrl;
  process.env.PGSSL = 'disable';
  try {
    const store = await createStore();
    await store.init();
    return store;
  } finally {
    if (oldDb == null) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = oldDb;
    if (oldSsl == null) delete process.env.PGSSL;
    else process.env.PGSSL = oldSsl;
  }
}

async function calibratePostgres(store, prefix) {
  const { rows } = await store.pool.query(
    "SELECT COALESCE(sum((payload->>'xp')::bigint),0)::bigint AS xp FROM system_events WHERE event_type='progression.awarded' AND claim_status='verified'"
  );
  const level = levelSnapshotForXp(Number(rows[0].xp));
  await store.applyAction({
    type: 'profile.calibrate',
    payload: {
      level: level.level,
      xp_to_next: level.xp_to_next,
      economy_status: 'CALIBRATED',
      evidence: { status: 'verified', source: 'ci', ref: `${prefix}:profile` }
    }
  }, genericContext, `${prefix}-profile-calibration`);
}

async function cancel(store, questId, key) {
  await store.applyAction(
    { type: 'quest.cancel', payload: { quest_id: questId, reason: 'test cleanup' } },
    genericContext,
    key
  );
}

async function completeWithoutReward(store, questId, key) {
  await store.applyAction({
    type: 'quest.complete',
    payload: {
      quest_id: questId,
      evidence: { status: 'verified', source: 'ci', ref: `${key}:done` }
    }
  }, genericContext, key);
}

test('PostgreSQL outcome gate protects direct, strategic XMind and historical outcome identities', { skip: !databaseUrl }, async () => {
  const store = await postgresStore();
  const suffix = randomUUID().slice(0, 8);
  await calibratePostgres(store, `pg-outcome-${suffix}`);

  try {
    const directKey = `ci:outcome:${suffix}:direct`;
    const directId = `pg-direct-${suffix}`;
    const direct = await store.applyAction(
      scoredQuest(directId, directKey),
      policyContext(),
      `pg-direct-create-${suffix}`
    );
    assert.equal(direct.event.payload.outcome_key, directKey);
    await cancel(store, directId, `pg-direct-cancel-${suffix}`);

    await assert.rejects(
      store.applyAction(
        scoredQuest(`pg-missing-${suffix}`, null),
        policyContext(),
        `pg-missing-create-${suffix}`
      ),
      /outcome_key is required/
    );

    const now = new Date();
    const xmindSourceRef = buildXmindStrategySourceRef({
      file_id: 'OutcomeFile1',
      sheet_id: 'outcome_sheet_001',
      topic_id: 'outcome_topic_001',
      topic_label: 'Outcome key integration probe',
      checked_at: now.toISOString(),
      status: 'VERIFIED',
      conflict_status: 'CLEAR',
      mode: 'READ_ONLY',
      owner_refs: ['domains/learning.md'],
      policy_refs: ['system-quest-difficulty:v1', 'system-strategic-context:v1']
    }, { now });
    const xmindKey = `ci:outcome:${suffix}:xmind`;
    const xmindId = `pg-xmind-${suffix}`;
    const xmind = await store.applyAction(
      scoredQuest(xmindId, xmindKey),
      policyContext(xmindSourceRef),
      `pg-xmind-create-${suffix}`
    );
    assert.equal(xmind.event.payload.outcome_key, xmindKey);
    await cancel(store, xmindId, `pg-xmind-cancel-${suffix}`);

    await assert.rejects(
      store.applyAction(
        scoredQuest(`pg-xmind-missing-${suffix}`, null),
        policyContext(xmindSourceRef),
        `pg-xmind-missing-create-${suffix}`
      ),
      /outcome_key is required/
    );

    const legacySourceKey = `ci:outcome:${suffix}:legacy-source`;
    const legacySourceId = `pg-legacy-source-${suffix}`;
    const legacySourceContext = {
      ...genericContext,
      sourceRef: `legacy:v0;outcome_key=${legacySourceKey};score=2`
    };
    const legacySource = await store.applyAction(
      scoredQuest(legacySourceId, null),
      legacySourceContext,
      `pg-legacy-source-create-${suffix}`
    );
    assert.equal(legacySource.event.payload.outcome_key, undefined);
    const sourceDerived = await store.pool.query(
      'SELECT system_event_outcome_key_v1(payload, source_ref) AS outcome_key FROM system_events WHERE event_id=$1',
      [legacySource.event.event_id]
    );
    assert.equal(sourceDerived.rows[0].outcome_key, legacySourceKey);
    await completeWithoutReward(store, legacySourceId, `pg-legacy-source-complete-${suffix}`);
    await assert.rejects(
      store.applyAction(
        scoredQuest(`pg-legacy-source-duplicate-${suffix}`, legacySourceKey),
        policyContext(),
        `pg-legacy-source-duplicate-${suffix}`
      ),
      /scored outcome is already active or completed/
    );

    const legacyDescriptionKey = `ci:outcome:${suffix}:legacy-description`;
    const legacyDescriptionId = `pg-legacy-description-${suffix}`;
    const legacyDescription = await store.applyAction(
      scoredQuest(legacyDescriptionId, null, {
        description: `Historical probe outcome_key=${legacyDescriptionKey}`
      }),
      genericContext,
      `pg-legacy-description-create-${suffix}`
    );
    assert.equal(legacyDescription.event.payload.outcome_key, undefined);
    const descriptionDerived = await store.pool.query(
      'SELECT system_event_outcome_key_v1(payload, source_ref) AS outcome_key FROM system_events WHERE event_id=$1',
      [legacyDescription.event.event_id]
    );
    assert.equal(descriptionDerived.rows[0].outcome_key, legacyDescriptionKey);
    await completeWithoutReward(store, legacyDescriptionId, `pg-legacy-description-complete-${suffix}`);
    await assert.rejects(
      store.applyAction(
        scoredQuest(`pg-legacy-description-duplicate-${suffix}`, legacyDescriptionKey),
        policyContext(),
        `pg-legacy-description-duplicate-${suffix}`
      ),
      /scored outcome is already active or completed/
    );

    const retryKey = `ci:outcome:${suffix}:retry`;
    const expiredId = `pg-expired-${suffix}`;
    await store.applyAction(
      scoredQuest(expiredId, retryKey, {
        deadline_at: '2000-01-01T00:00:00Z',
        timing_mode: 'HARD_EXTERNAL'
      }),
      policyContext(),
      `pg-expired-create-${suffix}`
    );
    await store.applyAction(
      { type: 'quest.expire', payload: { quest_id: expiredId, reason: 'external deadline passed' } },
      genericContext,
      `pg-expired-terminal-${suffix}`
    );
    const retryId = `pg-retry-${suffix}`;
    const retry = await store.applyAction(
      scoredQuest(retryId, retryKey),
      policyContext(),
      `pg-retry-create-${suffix}`
    );
    assert.equal(retry.event.payload.outcome_key, retryKey);
    await cancel(store, retryId, `pg-retry-cancel-${suffix}`);
  } finally {
    await store.close();
  }
});
