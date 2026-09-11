import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { levelSnapshotForXp } from '../src/calibration.mjs';
import { createStore } from '../src/resolution-store.mjs';

const policyContext = {
  actor: 'chatgpt',
  source: 'outcome-key-test',
  sourceRef: 'system-quest-difficulty:v1:ci'
};
const genericContext = {
  actor: 'chatgpt',
  source: 'outcome-key-test',
  sourceRef: 'ci:outcome-key'
};

async function ephemeralStore() {
  const oldAllow = process.env.SYSTEM_ALLOW_EPHEMERAL;
  const oldDb = process.env.DATABASE_URL;
  process.env.SYSTEM_ALLOW_EPHEMERAL = '1';
  delete process.env.DATABASE_URL;
  try {
    const store = await createStore();
    await store.init();
    return store;
  } finally {
    if (oldAllow == null) delete process.env.SYSTEM_ALLOW_EPHEMERAL;
    else process.env.SYSTEM_ALLOW_EPHEMERAL = oldAllow;
    if (oldDb == null) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = oldDb;
  }
}

async function calibrate(store, prefix) {
  await store.applyAction({
    type: 'profile.calibrate',
    payload: {
      level: 1,
      xp_to_next: 500,
      economy_status: 'CALIBRATED',
      evidence: { status: 'verified', source: 'ci', ref: `${prefix}:profile` }
    }
  }, genericContext, `${prefix}-profile-calibration`);
}

function scoredQuest(questId, outcomeKey, extra = {}) {
  return {
    type: 'quest.create',
    payload: {
      quest_id: questId,
      quest_version: 2,
      title: `Outcome probe ${questId}`,
      class: 'SIDE',
      rank: 'D',
      reward_xp: 10,
      reward_coins: 0,
      outcome_key: outcomeKey,
      objectives: [],
      ...extra
    }
  };
}

test('difficulty-managed scored Quest v2 persists outcome_key and rejects missing key', async () => {
  const store = await ephemeralStore();
  await calibrate(store, 'memory-key');
  const created = await store.applyAction(
    scoredQuest('memory-key-q', 'learning:german:nicos-weg:a1:lesson-1'),
    policyContext,
    'memory-key-create'
  );
  assert.equal(created.event.payload.outcome_key, 'learning:german:nicos-weg:a1:lesson-1');

  await store.applyAction({ type: 'quest.cancel', payload: { quest_id: 'memory-key-q', reason: 'test cleanup' } }, genericContext, 'memory-key-cancel');
  await assert.rejects(
    store.applyAction({
      type: 'quest.create',
      payload: {
        quest_id: 'memory-no-key-q',
        quest_version: 2,
        title: 'Missing outcome key',
        class: 'SIDE',
        rank: 'D',
        reward_xp: 10,
        reward_coins: 0,
        objectives: []
      }
    }, policyContext, 'memory-no-key-create'),
    /outcome_key is required/
  );
  await store.close();
});

test('completed scored outcome cannot be minted again under a different quest_id', async () => {
  const store = await ephemeralStore();
  await calibrate(store, 'memory-duplicate');
  const outcomeKey = 'learning:german:atomic-outcome-probe';
  await store.applyAction(scoredQuest('memory-first-q', outcomeKey), policyContext, 'memory-first-create');
  const resolution = await store.applyAction({
    type: 'quest.resolve',
    payload: {
      quest_id: 'memory-first-q',
      evidence: { status: 'verified', source: 'ci', ref: 'memory:first:done' }
    }
  }, genericContext, 'memory-first-resolve');
  assert.equal(resolution.resolution.rewarded, true);

  await assert.rejects(
    store.applyAction(scoredQuest('memory-second-q', outcomeKey), policyContext, 'memory-second-create'),
    /scored outcome is already active or completed/
  );
  await store.close();
});

test('expired unrewarded attempt may retry the same outcome identity', async () => {
  const store = await ephemeralStore();
  await calibrate(store, 'memory-retry');
  const outcomeKey = 'learning:german:retry-after-expiry';
  await store.applyAction(
    scoredQuest('memory-expired-q', outcomeKey, { deadline_at: '2000-01-01T00:00:00Z' }),
    policyContext,
    'memory-expired-create'
  );
  await store.applyAction(
    { type: 'quest.expire', payload: { quest_id: 'memory-expired-q', reason: 'deadline passed' } },
    genericContext,
    'memory-expired-terminal'
  );
  const retry = await store.applyAction(
    scoredQuest('memory-retry-q', outcomeKey),
    policyContext,
    'memory-retry-create'
  );
  assert.equal(retry.event.payload.outcome_key, outcomeKey);
  await store.close();
});

const databaseUrl = process.env.TEST_DATABASE_URL?.trim();

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

test('PostgreSQL outcome gate blocks duplicate completed outcomes and allows expired retry', { skip: !databaseUrl }, async () => {
  const store = await postgresStore();
  const suffix = randomUUID().slice(0, 8);
  const duplicateKey = `ci:outcome:${suffix}:completed`;
  const retryKey = `ci:outcome:${suffix}:retry`;
  await calibratePostgres(store, `pg-outcome-${suffix}`);

  try {
    await store.applyAction(scoredQuest(`pg-first-${suffix}`, duplicateKey), policyContext, `pg-first-create-${suffix}`);
    const completed = await store.applyAction({
      type: 'quest.complete',
      payload: {
        quest_id: `pg-first-${suffix}`,
        evidence: { status: 'verified', source: 'ci', ref: `pg-outcome:${suffix}:done` }
      }
    }, genericContext, `pg-first-complete-${suffix}`);
    assert.equal(completed.event.event_type, 'quest.completed');
    await assert.rejects(
      store.applyAction(scoredQuest(`pg-duplicate-${suffix}`, duplicateKey), policyContext, `pg-duplicate-create-${suffix}`),
      /scored outcome is already active or completed/
    );

    await store.applyAction(
      scoredQuest(`pg-expired-${suffix}`, retryKey, { deadline_at: '2000-01-01T00:00:00Z' }),
      policyContext,
      `pg-expired-create-${suffix}`
    );
    await store.applyAction(
      { type: 'quest.expire', payload: { quest_id: `pg-expired-${suffix}`, reason: 'deadline passed' } },
      genericContext,
      `pg-expired-terminal-${suffix}`
    );
    const retry = await store.applyAction(
      scoredQuest(`pg-retry-${suffix}`, retryKey),
      policyContext,
      `pg-retry-create-${suffix}`
    );
    assert.equal(retry.event.payload.outcome_key, retryKey);
    await store.applyAction(
      { type: 'quest.cancel', payload: { quest_id: `pg-retry-${suffix}`, reason: 'test cleanup' } },
      genericContext,
      `pg-retry-cancel-${suffix}`
    );
  } finally {
    await store.close();
  }
});
