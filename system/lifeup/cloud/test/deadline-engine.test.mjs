import test from 'node:test';
import assert from 'node:assert/strict';
import { actionToEvent, buildSnapshot, validateEventAgainstHistory } from '../src/quest-v2.mjs';
import { normalizeDeadlineInterval, planDeadlineActions, runDeadlineSweep } from '../src/deadline-engine.mjs';

const context = { actor: 'test', source: 'deadline-test', sourceRef: 'ci' };

function memoryStore(seedActions = []) {
  const events = [];
  const keys = new Map();
  for (const [action, occurredAt = '2026-09-11T00:00:00Z'] of seedActions) {
    const event = actionToEvent(action, context);
    validateEventAgainstHistory(event, events);
    event.occurred_at = occurredAt;
    events.push(event);
  }
  return {
    async listAllEvents() { return structuredClone(events); },
    async applyAction(action, ctx, key) {
      if (keys.has(key)) return { event: structuredClone(keys.get(key)), replay: true };
      const event = actionToEvent(action, ctx);
      validateEventAgainstHistory(event, events);
      event.occurred_at = '2026-09-11T16:31:00.000Z';
      events.push(event);
      keys.set(key, event);
      return { event: structuredClone(event), replay: false };
    },
    events
  };
}

const quest = (deadline = '2026-09-11T16:30:00Z') => ({
  type: 'quest.create',
  payload: { quest_id: 'deadline-q', quest_version: 2, title: 'Deadline quest', deadline_at: deadline, objectives: [] }
});

test('scheduler interval is bounded and invalid input falls back safely', () => {
  assert.equal(normalizeDeadlineInterval(100), 5_000);
  assert.equal(normalizeDeadlineInterval('12000'), 12_000);
  assert.equal(normalizeDeadlineInterval('invalid'), 30_000);
});

test('planner selects one nearest reminder and never bursts older thresholds', () => {
  const snapshot = buildSnapshot([Object.assign(actionToEvent(quest(), context), { occurred_at: '2026-09-11T00:00:00Z' })]);
  const at23Hours = planDeadlineActions(snapshot, Date.parse('2026-09-10T17:30:00Z'));
  assert.equal(at23Hours.length, 1);
  assert.match(at23Hours[0].steps[0].action.payload.body, /24 часа/);
  const at50Minutes = planDeadlineActions(snapshot, Date.parse('2026-09-11T15:40:00Z'));
  assert.match(at50Minutes[0].steps[0].action.payload.body, /1 час/);
  const at10Minutes = planDeadlineActions(snapshot, Date.parse('2026-09-11T16:20:00Z'));
  assert.match(at10Minutes[0].steps[0].action.payload.body, /15 минут/);
});

test('overdue sweep expires through the action gate and records critical notification once', async () => {
  const store = memoryStore([[quest()]]);
  const delivered = [];
  const first = await runDeadlineSweep({ store, now: Date.parse('2026-09-11T16:31:00Z'), onNotification: (event) => delivered.push(event) });
  assert.deepEqual(first.map((x) => x.kind), ['expiry', 'expired-notification']);
  assert.equal(buildSnapshot(store.events).quests[0].status, 'EXPIRED');
  assert.equal(buildSnapshot(store.events).notifications[0].severity, 'CRITICAL');
  assert.equal(delivered.length, 1);

  const second = await runDeadlineSweep({ store, now: Date.parse('2026-09-11T16:32:00Z'), onNotification: (event) => delivered.push(event) });
  assert.deepEqual(second, []);
  assert.equal(store.events.filter((e) => e.event_type === 'quest.expired').length, 1);
  assert.equal(store.events.filter((e) => e.event_type === 'notification.pushed').length, 1);
});

test('terminal quests and deadline-free or legacy quests are never automated', () => {
  const snapshot = { quests: [
    { id: 'done', quest_version: 2, status: 'COMPLETED', deadline_at: '2000-01-01T00:00:00Z' },
    { id: 'no-deadline', quest_version: 2, status: 'ACTIVE', deadline_at: null },
    { id: 'legacy', quest_version: 1, status: 'ACTIVE', deadline_at: '2000-01-01T00:00:00Z' }
  ], notifications: [] };
  assert.deepEqual(planDeadlineActions(snapshot, Date.parse('2026-09-11T00:00:00Z')), []);
});

test('existing reminder notification suppresses duplicate planning after restart', () => {
  const created = Object.assign(actionToEvent(quest(), context), { occurred_at: '2026-09-11T00:00:00Z' });
  const snapshot = buildSnapshot([created]);
  const first = planDeadlineActions(snapshot, Date.parse('2026-09-11T16:20:00Z'))[0].steps[0];
  const notice = Object.assign(actionToEvent(first.action, context), { occurred_at: '2026-09-11T16:20:00Z' });
  const rebuilt = buildSnapshot([created, notice]);
  assert.deepEqual(planDeadlineActions(rebuilt, Date.parse('2026-09-11T16:21:00Z')), []);
});

test('an EXPIRED quest recovers a missing expiry notification after a crash gap', () => {
  const created = Object.assign(actionToEvent(quest(), context), { occurred_at: '2026-09-11T00:00:00Z' });
  const expired = Object.assign(actionToEvent({ type: 'quest.expire', payload: { quest_id: 'deadline-q', reason: 'deadline' } }, context), { occurred_at: '2026-09-11T16:31:00Z' });
  const snapshot = buildSnapshot([created, expired]);
  const plans = planDeadlineActions(snapshot, Date.parse('2026-09-11T16:32:00Z'));
  assert.equal(plans.length, 1);
  assert.deepEqual(plans[0].steps.map((step) => step.kind), ['expired-notification']);
});
