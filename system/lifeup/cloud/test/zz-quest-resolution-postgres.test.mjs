import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { levelSnapshotForXp } from '../src/calibration.mjs';
import { createStore } from '../src/resolution-store.mjs';

const databaseUrl = process.env.TEST_DATABASE_URL?.trim();
const context = { actor: 'chatgpt', source: 'postgres-resolution-test', sourceRef: 'ci:atomic-resolution' };

async function postgresStore() {
  const previousDatabase = process.env.DATABASE_URL;
  const previousSsl = process.env.PGSSL;
  process.env.DATABASE_URL = databaseUrl;
  process.env.PGSSL = 'disable';
  try {
    const store = await createStore();
    await store.init();
    return store;
  } finally {
    if (previousDatabase == null) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousDatabase;
    if (previousSsl == null) delete process.env.PGSSL;
    else process.env.PGSSL = previousSsl;
  }
}

test('PostgreSQL quest.resolve is one transaction over the existing action gate', { skip: !databaseUrl }, async () => {
  const store = await postgresStore();
  const suffix = randomUUID().slice(0, 8);
  const questId = `resolve-pg-${suffix}`;
  const rootKey = `resolve-pg-root-${suffix}`;

  try {
    const xpQuery = await store.pool.query(
      "SELECT COALESCE(sum((payload->>'xp')::bigint),0)::bigint AS xp FROM system_events WHERE event_type='progression.awarded' AND claim_status='verified'"
    );
    const level = levelSnapshotForXp(Number(xpQuery.rows[0].xp));
    await store.applyAction({
      type: 'profile.calibrate',
      payload: {
        level: level.level,
        xp_to_next: level.xp_to_next,
        economy_status: 'CALIBRATED',
        evidence: { status: 'verified', source: 'ci', ref: `pg-resolution:${suffix}:profile` }
      }
    }, context, `resolve-pg-profile-${suffix}`);

    await store.applyAction({
      type: 'quest.create',
      payload: {
        quest_id: questId,
        quest_version: 2,
        title: 'PostgreSQL atomic resolution probe',
        class: 'SIDE',
        rank: 'D',
        reward_xp: 10,
        reward_coins: 0,
        objectives: [
          { objective_id: 'done', title: 'Complete probe', target: 1, unit: 'outcome', required: true }
        ]
      }
    }, context, `resolve-pg-create-${suffix}`);

    const action = {
      type: 'quest.resolve',
      payload: {
        quest_id: questId,
        progress: [{ objective_id: 'done', value: 1 }],
        evidence: { status: 'verified', source: 'ci', ref: `pg-resolution:${suffix}:done` }
      }
    };
    const first = await store.applyAction(action, context, rootKey);
    assert.equal(first.replay, false);
    assert.deepEqual(first.events.map((event) => event.event_type), [
      'quest.progressed', 'quest.completed', 'progression.awarded'
    ]);
    assert.equal(first.events.at(-1).payload.xp, 10);
    assert.equal(first.events.at(-1).payload.coins, 0);
    assert.equal(first.events.at(-1).payload.reward_policy_ref, 'system-quest-reward:v1');

    const countBeforeReplay = await store.pool.query(
      'SELECT count(*)::bigint AS count FROM system_events WHERE payload->>\'quest_id\'=$1 OR payload->>\'basis_event_id\'=$2',
      [questId, first.resolution.completion_event_id]
    );
    const replay = await store.applyAction(action, context, rootKey);
    const countAfterReplay = await store.pool.query(
      'SELECT count(*)::bigint AS count FROM system_events WHERE payload->>\'quest_id\'=$1 OR payload->>\'basis_event_id\'=$2',
      [questId, first.resolution.completion_event_id]
    );
    assert.equal(replay.replay, true);
    assert.equal(replay.resolution.completion_event_id, first.resolution.completion_event_id);
    assert.equal(replay.resolution.award_event_id, first.resolution.award_event_id);
    assert.equal(Number(countAfterReplay.rows[0].count), Number(countBeforeReplay.rows[0].count));

    await assert.rejects(
      store.applyAction({
        ...action,
        payload: {
          ...action.payload,
          evidence: { status: 'verified', source: 'ci', ref: `pg-resolution:${suffix}:changed` }
        }
      }, context, rootKey),
      /Idempotency-Key was already used/
    );

    const invalidQuestId = `resolve-pg-invalid-${suffix}`;
    await store.applyAction({
      type: 'quest.create',
      payload: {
        quest_id: invalidQuestId,
        quest_version: 2,
        title: 'Invalid atomic resolution probe',
        class: 'SIDE',
        rank: 'D',
        reward_xp: 10,
        reward_coins: 0,
        objectives: [
          { objective_id: 'done', title: 'Complete probe', target: 1, unit: 'outcome', required: true }
        ]
      }
    }, context, `resolve-pg-invalid-create-${suffix}`);
    const beforeInvalid = await store.pool.query(
      'SELECT count(*)::bigint AS count FROM system_events WHERE payload->>\'quest_id\'=$1',
      [invalidQuestId]
    );
    await assert.rejects(
      store.applyAction({
        type: 'quest.resolve',
        payload: {
          quest_id: invalidQuestId,
          progress: [{ objective_id: 'done', value: 0 }],
          evidence: { status: 'verified', source: 'ci', ref: `pg-resolution:${suffix}:invalid` }
        }
      }, context, `resolve-pg-invalid-root-${suffix}`),
      /required objectives are incomplete|progress must strictly increase/
    );
    const afterInvalid = await store.pool.query(
      'SELECT count(*)::bigint AS count FROM system_events WHERE payload->>\'quest_id\'=$1',
      [invalidQuestId]
    );
    assert.equal(Number(afterInvalid.rows[0].count), Number(beforeInvalid.rows[0].count));

    await store.applyAction(
      { type: 'quest.cancel', payload: { quest_id: invalidQuestId, reason: 'test cleanup' } },
      context,
      `resolve-pg-invalid-cancel-${suffix}`
    );
  } finally {
    await store.close();
  }
});
