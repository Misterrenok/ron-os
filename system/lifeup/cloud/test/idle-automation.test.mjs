import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

import {
  DEFAULT_AUTOMATION_RECONCILE_INTERVAL_MS,
  MIN_AUTOMATION_RECONCILE_INTERVAL_MS,
  MAX_AUTOMATION_FAILURE_RETRY_MS,
  automationRetryDelayMs,
  nextAutomationWakeAt,
  normalizeAutomationReconcileInterval
} from '../src/automation-coordinator.mjs';
import { nextDeadlineWakeAt } from '../src/deadline-engine.mjs';
import { nextExecutionReminderWakeAt } from '../src/execution-reminder.mjs';

test('idle automation waits hours rather than polling Neon every few seconds', () => {
  const now = Date.parse('2026-09-30T06:00:00.000Z');
  assert.equal(nextAutomationWakeAt([], { now }), now + DEFAULT_AUTOMATION_RECONCILE_INTERVAL_MS);
  assert.equal(normalizeAutomationReconcileInterval(30_000), MIN_AUTOMATION_RECONCILE_INTERVAL_MS);
});


test('persistent automation failures back off instead of pinning Neon awake', () => {
  assert.equal(automationRetryDelayMs(1), 10 * 60_000);
  assert.equal(automationRetryDelayMs(2), 20 * 60_000);
  assert.equal(automationRetryDelayMs(20), MAX_AUTOMATION_FAILURE_RETRY_MS);
});

test('known hard deadline schedules the exact next reminder boundary', () => {
  const now = Date.parse('2026-09-30T06:00:00.000Z');
  const due = now + 30 * 60 * 60_000;
  const snapshot = {
    quests: [{
      id: 'q-deadline',
      quest_version: 2,
      status: 'ACTIVE',
      timing_mode: 'HARD_EXTERNAL',
      title: 'Deadline quest',
      deadline_at: new Date(due).toISOString()
    }],
    notifications: []
  };
  assert.equal(nextDeadlineWakeAt(snapshot, [], now), due - 24 * 60 * 60_000);
});

test('explicit execution reminder schedules exact remind_at without periodic sweep', () => {
  const now = Date.parse('2026-09-30T06:00:00.000Z');
  const remindAt = now + 37 * 60_000;
  const snapshot = {
    quests: [{ id: 'q-reminder', quest_version: 2, status: 'ACTIVE' }],
    notifications: []
  };
  const events = [{
    seq: 1,
    event_id: 'evt-reminder',
    event_type: 'reminder.scheduled',
    payload: {
      schedule_id: 'sched-1',
      quest_id: 'q-reminder',
      remind_at: new Date(remindAt).toISOString(),
      title: 'Сделать',
      body: 'Сейчас'
    }
  }];
  assert.equal(nextExecutionReminderWakeAt(snapshot, events, now), remindAt);
});

test('direct-ledger handoff and push retries remain event/timer driven', async () => {
  const [server, push, store, controller] = await Promise.all([
    fs.readFile(new URL('../src/server-v2.mjs', import.meta.url), 'utf8'),
    fs.readFile(new URL('../src/push-delivery.mjs', import.meta.url), 'utf8'),
    fs.readFile(new URL('../src/store-v2.mjs', import.meta.url), 'utf8'),
    fs.readFile(new URL('../../../skills/system-controller.md', import.meta.url), 'utf8')
  ]);
  assert.match(server, /automationCoordinator\.observe\(events\)/);
  assert.match(push, /nextAttemptAt/);
  assert.match(store, /nextPushDeliveryAttemptAt/);
  assert.match(controller, /public `\/api\/v1\/snapshot` once/);
});

test('production server and PWA no longer contain continuous database snapshot polling', async () => {
  const [server, app] = await Promise.all([
    fs.readFile(new URL('../src/server-v2.mjs', import.meta.url), 'utf8'),
    fs.readFile(new URL('../public/app-v2.js', import.meta.url), 'utf8')
  ]);
  assert.match(server, /createAutomationCoordinator/);
  assert.doesNotMatch(server, /startDeadlineEngine|startExecutionReminderEngine|startGrowthEngine|startPlayerFeedbackEngine/);
  assert.doesNotMatch(server, /setInterval\(/);
  assert.doesNotMatch(app, /setInterval\(refreshWhenUsable/);
});
