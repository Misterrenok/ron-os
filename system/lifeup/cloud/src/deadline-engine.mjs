import { createHash } from 'node:crypto';
import { buildSnapshot } from './quest-v2.mjs';
import {
  SOFT_TARGET_POLICY_VERSION,
  SOFT_TARGET_REMINDER_LEAD_MS,
  deriveLatestSoftTargets,
  softTargetNotificationId
} from './soft-target.mjs';

export const DEADLINE_POLICY_VERSION = 'deadline-v1';
export const DEFAULT_REMINDERS = [
  { code: '15m', lead_ms: 15 * 60_000, label: '15 минут' },
  { code: '1h', lead_ms: 60 * 60_000, label: '1 час' },
  { code: '24h', lead_ms: 24 * 60 * 60_000, label: '24 часа' }
];

export function normalizeDeadlineInterval(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(5_000, parsed) : 30_000;
}

const ENGINE_CONTEXT = {
  actor: 'system',
  source: 'system-deadline-engine',
  sourceRef: `policy:${DEADLINE_POLICY_VERSION}`
};

const SOFT_TARGET_CONTEXT = {
  actor: 'system',
  source: 'system-soft-target-engine',
  sourceRef: `policy:${SOFT_TARGET_POLICY_VERSION}`
};

function stableSuffix(...parts) {
  return createHash('sha256').update(parts.join('\u0000')).digest('hex').slice(0, 32);
}

function deadlineMs(quest) {
  if (!quest?.deadline_at) return null;
  const value = new Date(quest.deadline_at).getTime();
  return Number.isFinite(value) ? value : null;
}

function reminderNotification(quest, reminder) {
  const suffix = stableSuffix(quest.id, quest.deadline_at, reminder.code);
  return {
    action: {
      type: 'notification.push',
      payload: {
        notification_id: `deadline-${suffix}`,
        title: `Срок задания: ${quest.title}`.slice(0, 180),
        body: `Осталось ${reminder.label}. Открой Систему и выполни обязательные цели.`.slice(0, 1200),
        severity: reminder.code === '15m' ? 'WARNING' : 'INFO',
        kind: 'QUEST'
      }
    },
    idempotencyKey: `${DEADLINE_POLICY_VERSION}:reminder:${suffix}`,
    kind: 'reminder',
    context: ENGINE_CONTEXT
  };
}

function expiryActions(quest) {
  const suffix = stableSuffix(quest.id, quest.deadline_at, 'expired');
  return [
    {
      action: {
        type: 'quest.expire',
        payload: { quest_id: quest.id, reason: `Срок истёк по правилу ${DEADLINE_POLICY_VERSION}` }
      },
      idempotencyKey: `${DEADLINE_POLICY_VERSION}:expire:${suffix}`,
      kind: 'expiry',
      context: ENGINE_CONTEXT
    },
    {
      action: {
        type: 'notification.push',
        payload: {
          notification_id: `expired-${suffix}`,
          title: `Задание просрочено: ${quest.title}`.slice(0, 180),
          body: 'Срок пропущен. Награда утрачена, задание завершено со статусом «ИСТЕКЛО». Неподтверждённый прогресс не начислен.',
          severity: 'CRITICAL',
          kind: 'QUEST'
        }
      },
      idempotencyKey: `${DEADLINE_POLICY_VERSION}:expired-notice:${suffix}`,
      kind: 'expired-notification',
      context: ENGINE_CONTEXT
    }
  ];
}

function softTargetReminder(quest, target) {
  const id = softTargetNotificationId('reminder', quest.id, target.target_at);
  return {
    action: {
      type: 'notification.push',
      payload: {
        notification_id: id,
        title: `Мягкая цель: ${quest.title}`.slice(0, 180),
        body: 'До рекомендуемого времени осталось меньше часа. Это не жёсткий дедлайн: пропуск не завершит квест и не сожжёт награду.',
        severity: 'INFO',
        kind: 'QUEST'
      }
    },
    idempotencyKey: `${SOFT_TARGET_POLICY_VERSION}:reminder:${id}`,
    kind: 'soft-reminder',
    context: SOFT_TARGET_CONTEXT
  };
}

function softTargetMissed(quest, target) {
  const id = softTargetNotificationId('missed', quest.id, target.target_at);
  return {
    action: {
      type: 'notification.push',
      payload: {
        notification_id: id,
        title: `Мягкая цель пропущена: ${quest.title}`.slice(0, 180),
        body: 'Квест остаётся активным, награда не потеряна. Система отмечает задержку как сигнал приоритета, а не как провал.',
        severity: 'WARNING',
        kind: 'QUEST'
      }
    },
    idempotencyKey: `${SOFT_TARGET_POLICY_VERSION}:missed:${id}`,
    kind: 'soft-missed',
    context: SOFT_TARGET_CONTEXT
  };
}

export function planDeadlineActions(snapshot, now = Date.now(), reminders = DEFAULT_REMINDERS) {
  const nowMs = now instanceof Date ? now.getTime() : Number(now);
  if (!Number.isFinite(nowMs)) throw new Error('now must be a valid timestamp');
  const existingNotifications = new Set((snapshot?.notifications ?? []).map((item) => item.id));
  const plans = [];

  for (const quest of snapshot?.quests ?? []) {
    if (quest.quest_version !== 2) continue;
    const dueAt = deadlineMs(quest);
    if (dueAt == null) continue;
    const expiry = expiryActions(quest);

    if (quest.status === 'EXPIRED') {
      const notice = expiry[1];
      if (!existingNotifications.has(notice.action.payload.notification_id)) {
        plans.push({ quest, steps: [notice] });
      }
      continue;
    }
    if (quest.status !== 'ACTIVE') continue;

    if (nowMs >= dueAt) {
      plans.push({
        quest,
        steps: expiry.filter((step) => step.kind === 'expiry' || !existingNotifications.has(step.action.payload.notification_id))
      });
      continue;
    }

    const remaining = dueAt - nowMs;
    const reminder = [...reminders]
      .sort((a, b) => a.lead_ms - b.lead_ms)
      .find((item) => remaining <= item.lead_ms);
    if (!reminder) continue;
    const planned = reminderNotification(quest, reminder);
    if (!existingNotifications.has(planned.action.payload.notification_id)) {
      plans.push({ quest, steps: [planned] });
    }
  }
  return plans;
}

export function planSoftTargetActions(snapshot, events, now = Date.now()) {
  const nowMs = now instanceof Date ? now.getTime() : Number(now);
  if (!Number.isFinite(nowMs)) throw new Error('now must be a valid timestamp');
  const existingNotifications = new Set((snapshot?.notifications ?? []).map((item) => item.id));
  const targets = deriveLatestSoftTargets(events);
  const plans = [];

  for (const quest of snapshot?.quests ?? []) {
    if (quest.quest_version !== 2 || quest.status !== 'ACTIVE') continue;
    const target = targets.get(quest.id);
    if (!target) continue;
    const targetMs = new Date(target.target_at).getTime();
    if (!Number.isFinite(targetMs)) continue;
    const hardMs = deadlineMs(quest);
    if (hardMs != null && targetMs > hardMs) continue;

    const step = nowMs >= targetMs
      ? softTargetMissed(quest, target)
      : targetMs - nowMs <= SOFT_TARGET_REMINDER_LEAD_MS
        ? softTargetReminder(quest, target)
        : null;
    if (!step || existingNotifications.has(step.action.payload.notification_id)) continue;
    plans.push({ quest, steps: [step] });
  }
  return plans;
}

export async function runDeadlineSweep({ store, now = Date.now(), onNotification = async () => {} }) {
  const events = await store.listAllEvents();
  const snapshot = buildSnapshot(events);
  const plans = [
    ...planDeadlineActions(snapshot, now),
    ...planSoftTargetActions(snapshot, events, now)
  ];
  const results = [];

  for (const plan of plans) {
    let lifecycleCommitted = true;
    for (const step of plan.steps) {
      if (step.kind === 'expired-notification' && !lifecycleCommitted) break;
      try {
        const result = await store.applyAction(step.action, step.context ?? ENGINE_CONTEXT, step.idempotencyKey);
        results.push({ quest_id: plan.quest.id, kind: step.kind, replay: result.replay, event: result.event });
        if (step.kind === 'expiry') lifecycleCommitted = true;
        if (step.action.type === 'notification.push') await onNotification(result.event);
      } catch (error) {
        if (step.kind === 'expiry') lifecycleCommitted = false;
        results.push({ quest_id: plan.quest.id, kind: step.kind, error });
        break;
      }
    }
  }
  return results;
}

export function startDeadlineEngine({ store, intervalMs = 30_000, onNotification, onError = console.error }) {
  let running = false;
  let stopped = false;
  const tick = async () => {
    if (running || stopped) return;
    running = true;
    try { await runDeadlineSweep({ store, onNotification }); }
    catch (error) { onError(error); }
    finally { running = false; }
  };
  void tick();
  const timer = setInterval(() => void tick(), normalizeDeadlineInterval(intervalMs));
  timer.unref?.();
  return {
    runNow: tick,
    stop() { stopped = true; clearInterval(timer); }
  };
}
