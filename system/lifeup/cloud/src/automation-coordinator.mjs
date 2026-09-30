import { buildSnapshot } from './quest-v2.mjs';
import { nextDeadlineWakeAt, runDeadlineSweep } from './deadline-engine.mjs';
import { nextExecutionReminderWakeAt, runExecutionReminderSweep } from './execution-reminder.mjs';
import { planGrowthActions, runGrowthSweep } from './growth-engine.mjs';
import { planPlayerFeedbackActions, runPlayerFeedbackSweep } from './player-feedback-engine.mjs';

export const DEFAULT_AUTOMATION_RECONCILE_INTERVAL_MS = 12 * 60 * 60_000;
export const MIN_AUTOMATION_RECONCILE_INTERVAL_MS = 60 * 60_000;
export const AUTOMATION_FAILURE_RETRY_MS = 10 * 60_000;
export const MAX_AUTOMATION_FAILURE_RETRY_MS = 6 * 60 * 60_000;
const MAX_TIMER_DELAY_MS = 2_147_000_000;

export function automationRetryDelayMs(attempt) {
  const safeAttempt = Math.max(1, Math.floor(Number(attempt) || 1));
  return Math.min(MAX_AUTOMATION_FAILURE_RETRY_MS, AUTOMATION_FAILURE_RETRY_MS * (2 ** Math.min(10, safeAttempt - 1)));
}

function timestampMs(value) {
  if (value == null) return null;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string') return new Date(value).getTime();
  return Number(value);
}

export function normalizeAutomationReconcileInterval(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_AUTOMATION_RECONCILE_INTERVAL_MS;
  return Math.max(MIN_AUTOMATION_RECONCILE_INTERVAL_MS, parsed);
}

export function nextAutomationWakeAt(events = [], {
  now = Date.now(),
  reconcileIntervalMs = DEFAULT_AUTOMATION_RECONCILE_INTERVAL_MS,
  pushWakeAt = null
} = {}) {
  const nowMs = timestampMs(now);
  if (!Number.isFinite(nowMs)) throw new Error('now must be a valid timestamp');
  const reconcileMs = normalizeAutomationReconcileInterval(reconcileIntervalMs);
  const snapshot = buildSnapshot(events);

  if (planGrowthActions(events, { now: nowMs }).length || planPlayerFeedbackActions(events).length) return nowMs;

  const candidates = [nowMs + reconcileMs];
  const deadlineAt = nextDeadlineWakeAt(snapshot, events, nowMs);
  const reminderAt = nextExecutionReminderWakeAt(snapshot, events, nowMs);
  const pushAt = timestampMs(pushWakeAt);
  for (const value of [deadlineAt, reminderAt, pushAt]) {
    if (Number.isFinite(value)) candidates.push(value);
  }
  return Math.min(...candidates);
}

function maxEventSeq(events = []) {
  let max = 0;
  for (const event of events) {
    const seq = Number(event?.seq || 0);
    if (Number.isFinite(seq) && seq > max) max = seq;
  }
  return max;
}

export function createAutomationCoordinator({
  store,
  pushDelivery,
  reconcileIntervalMs = DEFAULT_AUTOMATION_RECONCILE_INTERVAL_MS,
  now = () => Date.now(),
  onError = console.error,
  setTimer = setTimeout,
  clearTimer = clearTimeout
} = {}) {
  if (!store || typeof store.listAllEvents !== 'function') throw new TypeError('store is required');
  if (!pushDelivery || typeof pushDelivery.drain !== 'function') throw new TypeError('pushDelivery is required');

  const safeReconcileMs = normalizeAutomationReconcileInterval(reconcileIntervalMs);
  let timer = null;
  let stopped = false;
  let running = false;
  let rerun = false;
  let lastObservedSeq = 0;
  let lastPushWakeAt = null;
  let nextWakeAt = null;
  let consecutiveFailures = 0;

  const onNotification = async () => pushDelivery.enqueueAndDrain();

  function clearScheduled() {
    if (timer != null) clearTimer(timer);
    timer = null;
    nextWakeAt = null;
  }

  function scheduleTarget(targetMs) {
    if (stopped) return;
    clearScheduled();
    const current = Number(now());
    const safeTarget = Math.max(current, Number(targetMs));
    const delay = Math.min(MAX_TIMER_DELAY_MS, Math.max(0, safeTarget - current));
    nextWakeAt = current + delay;
    timer = setTimer(() => {
      timer = null;
      nextWakeAt = null;
      void run('scheduled-wake');
    }, delay);
    timer?.unref?.();
  }

  function scheduleFromEvents(events, { afterRun = false } = {}) {
    const current = Number(now());
    const target = nextAutomationWakeAt(events, {
      now: current,
      reconcileIntervalMs: safeReconcileMs,
      pushWakeAt: lastPushWakeAt
    });
    lastObservedSeq = Math.max(lastObservedSeq, observedSeq);
    if (afterRun && target <= current) {
      consecutiveFailures += 1;
      scheduleTarget(current + automationRetryDelayMs(consecutiveFailures));
    } else {
      consecutiveFailures = 0;
      scheduleTarget(target);
    }
    return target;
  }

  async function run(reason = 'manual') {
    if (stopped) return;
    if (running) {
      rerun = true;
      return;
    }
    running = true;
    clearScheduled();
    try {
      await runDeadlineSweep({ store, onNotification });
      await runExecutionReminderSweep({ store, onNotification });
      await runGrowthSweep({ store, onNotification });
      await runPlayerFeedbackSweep({ store, onNotification });
      await pushDelivery.drain();
      lastPushWakeAt = typeof pushDelivery.nextAttemptAt === 'function'
        ? await pushDelivery.nextAttemptAt()
        : null;
      const events = await store.listAllEvents();
      scheduleFromEvents(events, { afterRun: true });
    } catch (error) {
      onError(error, reason);
      consecutiveFailures += 1;
      scheduleTarget(Number(now()) + automationRetryDelayMs(consecutiveFailures));
    } finally {
      running = false;
      if (rerun && !stopped) {
        rerun = false;
        queueMicrotask(() => void run('coalesced-observation'));
      }
    }
  }

  function observe(events = []) {
    if (stopped) return;
    const previousSeq = lastObservedSeq;
    const current = Number(now());
    const observedSeq = maxEventSeq(events);
    if (observedSeq > previousSeq) consecutiveFailures = 0;
    const newNotification = events.some((event) =>
      Number(event?.seq || 0) > previousSeq && event?.event_type === 'notification.pushed'
    );
    const target = nextAutomationWakeAt(events, {
      now: current,
      reconcileIntervalMs: safeReconcileMs,
      pushWakeAt: lastPushWakeAt
    });
    lastObservedSeq = Math.max(lastObservedSeq, maxEventSeq(events));
    if (target <= current || newNotification) {
      clearScheduled();
      queueMicrotask(() => void run('observed-ledger-change'));
      return;
    }
    scheduleTarget(target);
  }

  return {
    start() { void run('startup'); },
    runNow: run,
    observe,
    stop() {
      stopped = true;
      clearScheduled();
    },
    status() {
      return {
        running,
        next_wake_at: nextWakeAt == null ? null : new Date(nextWakeAt).toISOString(),
        reconcile_interval_ms: safeReconcileMs,
        continuous_polling: false
      };
    }
  };
}
