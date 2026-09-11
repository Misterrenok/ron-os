import test from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../src/resolution-store.mjs';

const context = { actor: 'chatgpt', source: 'resolution-test', sourceRef: 'ci:resolution' };

async function ephemeralStore() {
  const previousAllow = process.env.SYSTEM_ALLOW_EPHEMERAL;
  const previousDatabase = process.env.DATABASE_URL;
  process.env.SYSTEM_ALLOW_EPHEMERAL = '1';
  delete process.env.DATABASE_URL;
  try {
    const store = await createStore();
    await store.init();
    return store;
  } finally {
    if (previousAllow == null) delete process.env.SYSTEM_ALLOW_EPHEMERAL;
    else process.env.SYSTEM_ALLOW_EPHEMERAL = previousAllow;
    if (previousDatabase == null) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousDatabase;
  }
}

async function launchEconomy(store, prefix = 'resolution') {
  await store.applyAction({
    type: 'profile.calibrate',
    payload: {
      level: 1,
      rank: null,
      xp_to_next: 500,
      economy_status: 'CALIBRATED',
      evidence: { status: 'verified', source: 'ci', ref: `${prefix}:profile` }
    }
  }, context, `${prefix}-profile-calibration`);
}

async function createScoredQuest(store, questId, key) {
  return store.applyAction({
    type: 'quest.create',
    payload: {
      quest_id: questId,
      quest_version: 2,
      title: 'Atomic resolution test quest',
      class: 'SIDE',
      rank: 'D',
      reward_xp: 10,
      reward_coins: 0,
      objectives: [
        { objective_id: 'done', title: 'Complete the outcome', target: 1, unit: 'outcome', required: true }
      ]
    }
  }, context, key);
}

test('quest.resolve atomically commits verified final progress, completion and canonical reward', async () => {
  const store = await ephemeralStore();
  await launchEconomy(store, 'atomic');
  await createScoredQuest(store, 'atomic-q', 'atomic-create-q');

  const action = {
    type: 'quest.resolve',
    payload: {
      quest_id: 'atomic-q',
      progress: [{ objective_id: 'done', value: 1 }],
      evidence: { status: 'verified', source: 'ci', ref: 'atomic:verified-outcome' }
    }
  };
  const first = await store.applyAction(action, context, 'atomic-resolve-q');
  assert.equal(first.replay, false);
  assert.deepEqual(first.events.map((event) => event.event_type), [
    'quest.progressed', 'quest.completed', 'progression.awarded'
  ]);
  assert.equal(first.resolution.rewarded, true);
  const award = first.events.at(-1);
  assert.equal(award.payload.xp, 10);
  assert.equal(award.payload.coins, 0);
  assert.equal(award.payload.reward_policy_ref, 'system-quest-reward:v1');
  assert.equal(award.payload.basis_event_id, first.resolution.completion_event_id);

  const beforeReplay = await store.listAllEvents();
  const replay = await store.applyAction(action, context, 'atomic-resolve-q');
  const afterReplay = await store.listAllEvents();
  assert.equal(replay.replay, true);
  assert.equal(replay.resolution.completion_event_id, first.resolution.completion_event_id);
  assert.equal(replay.resolution.award_event_id, first.resolution.award_event_id);
  assert.equal(afterReplay.length, beforeReplay.length);

  await assert.rejects(
    store.applyAction({
      ...action,
      payload: {
        ...action.payload,
        evidence: { status: 'verified', source: 'ci', ref: 'atomic:changed-reuse' }
      }
    }, context, 'atomic-resolve-q'),
    /Idempotency-Key was already used/
  );
  await store.close();
});

test('quest.resolve refuses reported required progress and leaves no partial resolution events', async () => {
  const store = await ephemeralStore();
  await launchEconomy(store, 'reported');
  await createScoredQuest(store, 'reported-q', 'reported-create-q');
  await store.applyAction({
    type: 'quest.progress',
    payload: {
      quest_id: 'reported-q',
      objective_id: 'done',
      value: 1,
      evidence: { status: 'reported', source: 'ron', ref: 'reported-only' }
    }
  }, context, 'reported-progress-q');

  const before = await store.listAllEvents();
  await assert.rejects(
    store.applyAction({
      type: 'quest.resolve',
      payload: {
        quest_id: 'reported-q',
        evidence: { status: 'verified', source: 'ci', ref: 'completion-claim-alone' }
      }
    }, context, 'reported-resolve-q'),
    /required objective progress must be verified/
  );
  const after = await store.listAllEvents();
  assert.equal(after.length, before.length);
  assert.equal(after.filter((event) => event.payload?.quest_id === 'reported-q' && event.event_type === 'quest.completed').length, 0);
  assert.equal(after.filter((event) => event.event_type === 'progression.awarded').length, 0);
  await store.close();
});

test('quest.resolve preflight rejects incomplete updates without persisting final progress', async () => {
  const store = await ephemeralStore();
  await launchEconomy(store, 'incomplete');
  await createScoredQuest(store, 'incomplete-q', 'incomplete-create-q');
  const before = await store.listAllEvents();

  await assert.rejects(
    store.applyAction({
      type: 'quest.resolve',
      payload: {
        quest_id: 'incomplete-q',
        progress: [{ objective_id: 'done', value: 0 }],
        evidence: { status: 'verified', source: 'ci', ref: 'not-done' }
      }
    }, context, 'incomplete-resolve-q'),
    /required objectives are incomplete|progress must strictly increase/
  );

  const after = await store.listAllEvents();
  assert.equal(after.length, before.length);
  assert.equal(after.filter((event) => event.payload?.quest_id === 'incomplete-q' && event.event_type === 'quest.progressed').length, 0);
  await store.close();
});
