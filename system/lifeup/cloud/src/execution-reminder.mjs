import { createHash } from 'node:crypto';
import { buildSnapshot } from './quest-v2.mjs';

export const EXECUTION_REMINDER_POLICY_REF = 'system-execution-reminder:v1';
export const DEFAULT_EXECUTION_REMINDER_INTERVAL_MS = 30_000;
const SOURCE_PREFIX = `${EXECUTION_REMINDER_POLICY_REF}?`;

function text(value, field, max) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field} is required`);
  const normalized = value.trim();
  if (normalized.length > max) throw new Error(`${field} is too long`);
  return normalized;
}

export function normalizeExecutionReminderSchedule(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('execution reminder payload must be an object');
  const scheduleId = text(input.schedule_id, 'schedule_id', 100);
  const questId = text(input.quest_id, 'quest_id', 100);
  const parsed = new Date(input.remind_at);
  if (Number.isNaN(parsed.getTime())) throw new Error('remind_at must be a valid timestamp');
  const title = text(input.title, 'title', 180);
  const body = input.body == null ? '' : String(input.body).trim().slice(0, 1200);
  return { schedule_id: scheduleId, quest_id: questId, remind_at: parsed.toISOString(), title, body };
}

export function executionReminderSourceRef(scheduleId) {
  return `${SOURCE_PREFIX}schedule=${encodeURIComponent(text(scheduleId, 'schedule_id', 100))}`;
}

export function parseExecutionReminderSourceRef(value) {
  if (typeof value !== 'string' || !value.startsWith(SOURCE_PREFIX)) return null;
  const params = new URLSearchParams(value.slice(SOURCE_PREFIX.length));
  const scheduleId = params.get('schedule');
  if (!scheduleId || scheduleId.length > 100) return null;
  return { policy_ref: EXECUTION_REMINDER_POLICY_REF, schedule_id: scheduleId };
}

export function executionReminderNotificationId(scheduleId) {
  const suffix = createHash('sha256').update(scheduleId).digest('hex').slice(0, 32);
  return `execution-reminder-${suffix}`;
}

export function derivePendingExecutionReminders(events = []) {
  const fired = new Set();
  for (const event of events) {
    if (event?.event_type !== 'notification.pushed') continue;
    const parsed = parseExecutionReminderSourceRef(event.source_ref);
    if (parsed) fired.add(parsed.schedule_id);
  }
  const schedules = [];
  for (const event of events) {
    if (event?.event_type !== 'reminder.scheduled') continue;
    let schedule;
    try { schedule = normalizeExecutionReminderSchedule(event.payload); } catch { continue; }
    if (!fired.has(schedule.schedule_id)) schedules.push({ ...schedule, seq: Number(event.seq || 0), event_id: event.event_id });
  }
  return schedules.sort((a, b) => new Date(a.remind_at) - new Date(b.remind_at) || a.seq - b.seq);
}

function timestampMs(value) {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string') return new Date(value).getTime();
  return Number(value);
}

export function planExecutionReminderActions(snapshot, events, now = Date.now()) {
  const nowMs = timestampMs(now);
  if (!Number.isFinite(nowMs)) throw new Error('now must be a valid timestamp');
  const active = new Map((snapshot?.quests || []).filter((quest) => quest.quest_version === 2 && quest.status === 'ACTIVE').map((quest) => [quest.id, quest]));
  const plans = [];
  for (const schedule of derivePendingExecutionReminders(events)) {
    if (new Date(schedule.remind_at).getTime() > nowMs) continue;
    const quest = active.get(schedule.quest_id);
    if (!quest) continue;
    const sourceRef = executionReminderSourceRef(schedule.schedule_id);
    plans.push({
      schedule,
      quest,
      context: { actor: 'system', source: 'system-execution-reminder-engine', sourceRef },
      idempotencyKey: `${EXECUTION_REMINDER_POLICY_REF}:fire:${schedule.schedule_id}`,
      action: {
        type: 'notification.push',
        payload: {
          notification_id: executionReminderNotificationId(schedule.schedule_id),
          title: schedule.title,
          body: schedule.body,
          severity: 'INFO',
          kind: 'QUEST'
        }
      }
    });
  }
  return plans;
}

export async function runExecutionReminderSweep({ store, now = Date.now(), onNotification = async () => {} }) {
  const events = await store.listAllEvents();
  const snapshot = buildSnapshot(events);
  const plans = planExecutionReminderActions(snapshot, events, now);
  const results = [];
  for (const plan of plans) {
    try {
      const result = await store.applyAction(plan.action, plan.context, plan.idempotencyKey);
      results.push({ schedule_id: plan.schedule.schedule_id, quest_id: plan.quest.id, replay: result.replay, event: result.event });
      await onNotification(result.event);
    } catch (error) {
      results.push({ schedule_id: plan.schedule.schedule_id, quest_id: plan.quest.id, error });
    }
  }
  return results;
}

export function startExecutionReminderEngine({ store, intervalMs = DEFAULT_EXECUTION_REMINDER_INTERVAL_MS, onNotification, onError = console.error }) {
  let running = false;
  let stopped = false;
  const safeInterval = Math.max(5_000, Number(intervalMs) || DEFAULT_EXECUTION_REMINDER_INTERVAL_MS);
  const tick = async () => {
    if (running || stopped) return;
    running = true;
    try { await runExecutionReminderSweep({ store, onNotification }); }
    catch (error) { onError(error); }
    finally { running = false; }
  };
  void tick();
  const timer = setInterval(() => void tick(), safeInterval);
  timer.unref?.();
  return { runNow: tick, stop() { stopped = true; clearInterval(timer); } };
}
