import test from 'node:test';
import assert from 'node:assert/strict';
import { actionToEvent, buildSnapshot, validateEventAgainstHistory } from '../src/quest-v2.mjs';
import { planSoftTargetActions, runDeadlineSweep } from '../src/deadline-engine.mjs';
import { softTargetDeclarationAction } from '../src/soft-target.mjs';

const context = { actor: 'test', source: 'soft-target-test', sourceRef: 'ci' };

function seed({ deadline = null, target = '2026-09-12T18:30:00Z' } = {}) {
  const created = actionToEvent({
    type: 'quest.create',
    payload: { quest_id: 'q1', quest_version: 2, title: 'Quest', objectives: [], deadline_at: deadline }
  }, context);
  created.occurred_at = '2026-09-12T09:00:00Z';
  const declaration = softTargetDeclarationAction({
    quest: { id: 'q1', title: 'Quest' }, target_at: target
  });
  const set = actionToEvent(declaration.action, {
    actor: 'chatgpt', source: 'system-controller', sourceRef: declaration.source_ref
  });
  set.occurred_at = '2026-09-12T09:01:00Z';
  return [created, set];
}

function storeFrom(events) {
  const keys = new Map();
  return {
    events,
    async listAllEvents() { return structuredClone(events); },
    async applyAction(action, ctx, key) {
      if (keys.has(key)) return { event: structuredClone(keys.get(key)), replay: true };
      const event = actionToEvent(action, ctx);
      validateEventAgainstHistory(event, events);
      event.occurred_at = '2026-09-12T18:31:00Z';
      events.push(event);
      keys.set(key, event);
      return { event: structuredClone(event), replay: false };
    }
  };
}

test('soft target reminder is notification-only', () => {
  const events = seed();
  const plans = planSoftTargetActions(buildSnapshot(events), events, Date.parse('2026-09-12T17:45:00Z'));
  assert.equal(plans.length, 1);
  assert.equal(plans[0].steps[0].kind, 'soft-reminder');
  assert.equal(plans[0].steps[0].action.type, 'notification.push');
});

test('latest valid soft target is projected onto the active quest', () => {
  const events = seed();
  const state = buildSnapshot(events);
  assert.equal(state.quests[0].soft_target_at, '2026-09-12T18:30:00.000Z');
  assert.equal(state.quests[0].soft_target_policy_ref, 'system-soft-target:v1');
  assert.equal(state.quests[0].deadline_at, null);
  assert.equal(state.quests[0].status, 'ACTIVE');
});

test('soft target later than a hard deadline is not projected', () => {
  const state = buildSnapshot(seed({
    deadline: '2026-09-12T18:00:00Z',
    target: '2026-09-12T18:30:00Z'
  }));
  assert.equal(state.quests[0].soft_target_at, undefined);
  assert.equal(state.quests[0].deadline_at, '2026-09-12T18:00:00.000Z');
});

test('missed soft target stays active and never changes rewards', async () => {
  const store = storeFrom(seed());
  const result = await runDeadlineSweep({ store, now: Date.parse('2026-09-12T18:31:00Z') });
  assert.deepEqual(result.map((item) => item.kind), ['soft-missed']);
  const state = buildSnapshot(store.events);
  assert.equal(state.quests[0].status, 'ACTIVE');
  assert.equal(state.profile.xp, 0);
  assert.equal(state.profile.coins, 0);
  assert.equal(store.events.some((event) => ['quest.failed', 'quest.expired', 'progression.awarded'].includes(event.event_type)), false);

  const again = await runDeadlineSweep({ store, now: Date.parse('2026-09-12T18:32:00Z') });
  assert.deepEqual(again, []);
});

test('hard deadline takes precedence once it is due', () => {
  const events = seed({ deadline: '2026-09-12T18:00:00Z', target: '2026-09-12T17:30:00Z' });
  const plans = planSoftTargetActions(buildSnapshot(events), events, Date.parse('2026-09-12T18:01:00Z'));
  assert.deepEqual(plans, []);
});
