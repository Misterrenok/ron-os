import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EXECUTION_REMINDER_POLICY_REF,
  derivePendingExecutionReminders,
  executionReminderSourceRef,
  planExecutionReminderActions,
  runExecutionReminderSweep
} from '../src/execution-reminder.mjs';

const scheduleEvent = (overrides = {}) => ({
  seq: 2,
  event_id: 'schedule-event',
  event_type: 'reminder.scheduled',
  source_ref: EXECUTION_REMINDER_POLICY_REF,
  payload: {
    policy_ref: EXECUTION_REMINDER_POLICY_REF,
    schedule_id: 'q1-r1',
    quest_id: 'q1',
    remind_at: '2026-09-26T16:35:00.000Z',
    title: 'Бебрис: урок 2',
    body: 'Открой урок и сделай первые 5 минут.',
    ...overrides
  }
});

const snapshot = (status = 'ACTIVE') => ({
  quests: [{ id: 'q1', quest_version: 2, title: 'Бебрис: урок 2', status }]
});

test('pending reminder becomes one quest notification only when due and active', () => {
  const event = scheduleEvent();
  assert.equal(derivePendingExecutionReminders([event]).length, 1);
  assert.equal(planExecutionReminderActions(snapshot(), [event], '2026-09-26T16:34:59.000Z').length, 0);
  const plans = planExecutionReminderActions(snapshot(), [event], '2026-09-26T16:35:00.000Z');
  assert.equal(plans.length, 1);
  assert.equal(plans[0].action.type, 'notification.push');
  assert.equal(plans[0].action.payload.kind, 'QUEST');
  assert.match(plans[0].context.sourceRef, /system-execution-reminder:v1/);
  assert.equal(planExecutionReminderActions(snapshot('COMPLETED'), [event], '2026-09-26T17:00:00.000Z').length, 0);
});

test('fired reminder is no longer pending', () => {
  const event = scheduleEvent();
  const fired = {
    seq: 3,
    event_type: 'notification.pushed',
    source_ref: executionReminderSourceRef('q1-r1'),
    payload: { notification_id: 'n1' }
  };
  assert.equal(derivePendingExecutionReminders([event, fired]).length, 0);
  assert.equal(planExecutionReminderActions(snapshot(), [event, fired], '2026-09-26T17:00:00.000Z').length, 0);
});

test('sweep is idempotent through a stable fire key and asks push delivery to drain', async () => {
  const events = [
    { seq: 1, event_id: 'q', event_type: 'quest.created', occurred_at: '2026-09-25T00:00:00Z', actor: 'system', source: 'test', source_ref: null, claim_status: 'derived', idempotency_key: 'quest-key', request_hash: 'hash', payload: {
      quest_id: 'q1', quest_version: 2, title: 'Бебрис: урок 2', description: '', class: 'MAIN', rank: 'D', reward_xp: 10, reward_coins: 0,
      objectives: [], deadline_at: null, visibility: 'VISIBLE'
    }},
    scheduleEvent()
  ];
  const calls = [];
  let drains = 0;
  const store = {
    async listAllEvents() { return events; },
    async applyAction(action, context, key) {
      calls.push({ action, context, key });
      return { replay: false, event: { event_type: 'notification.pushed', payload: action.payload } };
    }
  };
  const results = await runExecutionReminderSweep({ store, now: '2026-09-26T17:00:00Z', onNotification: async () => { drains += 1; } });
  assert.equal(results.length, 1);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].key, 'system-execution-reminder:v1:fire:q1-r1');
  assert.equal(drains, 1);
});
