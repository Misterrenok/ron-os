import test from 'node:test';
import assert from 'node:assert/strict';
import { actionToEvent, buildSnapshot, validateEventAgainstHistory } from '../src/quest-v2.mjs';
import { normalizeDeadlineInterval, planDeadlineActions, planRecommendedWindowActions, runDeadlineSweep } from '../src/deadline-engine.mjs';
import { recommendedWindowDeclarationAction } from '../src/timing-pressure.mjs';

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

const noDeadlineQuest = () => ({
  type: 'quest.create',
  payload: { quest_id: 'recommended-q', quest_version: 2, title: 'Recommended quest', deadline_at: null, objectives: [] }
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
  assert.match(buildSnapshot(store.events).notifications[0].body, /Уже заработанный прогресс не изменён/);
  assert.equal(delivered.length, 1);

  const second = await runDeadlineSweep({ store, now: Date.parse('2026-09-11T16:32:00Z'), onNotification: (event) => delivered.push(event) });
  assert.deepEqual(second, []);
  assert.equal(store.events.filter((e) => e.event_type === 'quest.expired').length, 1);
  assert.equal(store.events.filter((e) => e.event_type === 'notification.pushed').length, 1);
});

test('terminal quests and deadline-free or legacy quests are never automated as hard deadlines', () => {
  const snapshot = { quests: [
    { id: 'done', quest_version: 2, status: 'COMPLETED', deadline_at: '2000-01-01T00:00:00Z' },
    { id: 'no-deadline', quest_version: 2, status: 'ACTIVE', deadline_at: null },
    { id: 'legacy', quest_version: 1, status: 'ACTIVE', deadline_at: '2000-01-01T00:00:00Z' }
  ], notifications: [] };
  assert.deepEqual(planDeadlineActions(snapshot, Date.parse('2026-09-11T00:00:00Z')), []);
});

test('recommended window gets at most a pre-window informational reminder', () => {
  const created = Object.assign(actionToEvent(noDeadlineQuest(), context), { seq: 1, occurred_at: '2026-09-11T00:00:00Z' });
  const questSnapshot = buildSnapshot([created]);
  const declaration = recommendedWindowDeclarationAction({
    quest: questSnapshot.quests[0],
    target_at: '2026-09-11T16:30:00Z',
    reason: 'best execution window'
  });
  const declared = Object.assign(actionToEvent(declaration.action, {
    actor: 'test', source: 'system-controller', sourceRef: declaration.source_ref
  }), { seq: 2, occurred_at: '2026-09-11T12:00:00Z' });
  const events = [created, declared];
  const snapshot = buildSnapshot(events);

  assert.deepEqual(planRecommendedWindowActions(snapshot, events, Date.parse('2026-09-11T15:00:00Z')), []);
  const near = planRecommendedWindowActions(snapshot, events, Date.parse('2026-09-11T15:45:00Z'));
  assert.equal(near.length, 1);
  assert.deepEqual(near[0].steps.map((step) => step.kind), ['recommended-reminder']);
  assert.equal(near[0].steps[0].action.payload.severity, 'INFO');
  assert.match(near[0].steps[0].action.payload.title, /^Рекомендуемое окно:/);
  assert.doesNotMatch(near[0].steps[0].action.payload.body, /награда утрачена|провал/i);
});

test('passed recommended window produces no missed warning and never changes quest lifecycle', () => {
  const created = Object.assign(actionToEvent(noDeadlineQuest(), context), { seq: 1, occurred_at: '2026-09-11T00:00:00Z' });
  const questSnapshot = buildSnapshot([created]);
  const declaration = recommendedWindowDeclarationAction({ quest: questSnapshot.quests[0], target_at: '2026-09-11T16:30:00Z' });
  const declared = Object.assign(actionToEvent(declaration.action, {
    actor: 'test', source: 'system-controller', sourceRef: declaration.source_ref
  }), { seq: 2, occurred_at: '2026-09-11T12:00:00Z' });
  const events = [created, declared];
  const snapshot = buildSnapshot(events);

  assert.deepEqual(planRecommendedWindowActions(snapshot, events, Date.parse('2026-09-11T16:30:00Z')), []);
  assert.deepEqual(planRecommendedWindowActions(snapshot, events, Date.parse('2026-09-12T16:30:00Z')), []);
  assert.equal(snapshot.quests[0].status, 'ACTIVE');
});

test('existing hard reminder notification suppresses duplicate planning after restart', () => {
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
