import { createHash } from 'node:crypto';
import { buildSnapshot } from './quest-v2.mjs';
import { CHALLENGE_POLICY_REF } from './challenge-contract.mjs';
import {
  TIMING_POLICY_VERSION,
  RECOMMENDED_WINDOW_REMINDER_LEAD_MS,
  deriveLatestRecommendedWindows,
  timingNotificationId
} from './timing-pressure.mjs';

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

const CHALLENGE_CONTEXT = {
  actor: 'system',
  source: 'system-deadline-engine',
  sourceRef: `policy:${CHALLENGE_POLICY_REF}`
};

const RECOMMENDED_WINDOW_CONTEXT = {
  actor: 'system',
  source: 'system-timing-engine',
  sourceRef: `policy:${TIMING_POLICY_VERSION}`
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
  const challenge = quest?.timing_mode === 'CHALLENGE';
  const suffix = stableSuffix(quest.id, quest.deadline_at, reminder.code);
  return {
    action: {
      type: 'notification.push',
      payload: {
        notification_id: `deadline-${suffix}`,
        title: `${challenge ? 'Испытание' : 'Срок задания'}: ${quest.title}`.slice(0, 180),
        body: challenge
          ? `Осталось ${reminder.label}. Если испытание не будет завершено вовремя, Система активирует заранее согласованное восстановление.`.slice(0, 1200)
          : `Осталось ${reminder.label}. Открой Систему и выполни обязательные цели.`.slice(0, 1200),
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
          body: 'Срок пропущен. Награда этого задания недоступна, задание завершено со статусом «ИСТЕКЛО». Уже заработанный прогресс не изменён.',
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

function challengeExpiryActions(quest) {
  const contractId = quest?.challenge_contract?.contract_id;
  if (!contractId) throw new Error('Challenge quest is missing its recovery contract');
  const suffix = stableSuffix(quest.id, contractId, quest.deadline_at, 'challenge-expired');
  return [
    {
      contract_id: contractId,
      idempotencyKey: `${CHALLENGE_POLICY_REF}:expire:${suffix}`,
      kind: 'challenge-expiry',
      context: CHALLENGE_CONTEXT
    },
    {
      action: {
        type: 'notification.push',
        payload: {
          notification_id: `challenge-expired-${suffix}`,
          title: `Испытание завершено: ${quest.title}`.slice(0, 180),
          body: `Срок испытания истёк. Заранее согласованное восстановление «${quest.challenge_contract.recovery_title}» активировано. Уже заработанный прогресс не изменён.`.slice(0, 1200),
          severity: 'WARNING',
          kind: 'QUEST'
        }
      },
      idempotencyKey: `${CHALLENGE_POLICY_REF}:expired-notice:${suffix}`,
      kind: 'expired-notification',
      context: CHALLENGE_CONTEXT
    }
  ];
}

function recommendedWindowReminder(quest, target) {
  const id = timingNotificationId('recommended-reminder', quest.id, target.target_at);
  return {
    action: {
      type: 'notification.push',
      payload: {
        notification_id: id,
        title: `Рекомендуемое окно: ${quest.title}`.slice(0, 180),
        body: 'До рекомендуемого времени осталось меньше часа. Это ориентир для планирования: пропуск не завершит задание и не изменит награду.',
        severity: 'INFO',
        kind: 'QUEST'
      }
    },
    idempotencyKey: `${TIMING_POLICY_VERSION}:recommended-reminder:${id}`,
    kind: 'recommended-reminder',
    context: RECOMMENDED_WINDOW_CONTEXT
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
    const challenge = quest.timing_mode === 'CHALLENGE';
    const expiry = challenge ? challengeExpiryActions(quest) : expiryActions(quest);

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
        steps: expiry.filter((step) => ['expiry', 'challenge-expiry'].includes(step.kind) || !existingNotifications.has(step.action.payload.notification_id))
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

export function planRecommendedWindowActions(snapshot, events, now = Date.now()) {
  const nowMs = now instanceof Date ? now.getTime() : Number(now);
  if (!Number.isFinite(nowMs)) throw new Error('now must be a valid timestamp');
  const existingNotifications = new Set((snapshot?.notifications ?? []).map((item) => item.id));
  const targets = deriveLatestRecommendedWindows(events);
  const plans = [];

  for (const quest of snapshot?.quests ?? []) {
    if (quest.quest_version !== 2 || quest.status !== 'ACTIVE') continue;
    const target = targets.get(quest.id);
    if (!target) continue;
    const targetMs = new Date(target.target_at).getTime();
    if (!Number.isFinite(targetMs) || nowMs >= targetMs) continue;
    const hardMs = deadlineMs(quest);
    if (hardMs != null && targetMs > hardMs) continue;
    if (targetMs - nowMs > RECOMMENDED_WINDOW_REMINDER_LEAD_MS) continue;

    const step = recommendedWindowReminder(quest, target);
    if (existingNotifications.has(step.action.payload.notification_id)) continue;
    plans.push({ quest, steps: [step] });
  }
  return plans;
}

// Compatibility export for callers/tests that still use the old function name.
export const planSoftTargetActions = planRecommendedWindowActions;

export async function runDeadlineSweep({ store, now = Date.now(), onNotification = async () => {} }) {
  const events = await store.listAllEvents();
  const snapshot = buildSnapshot(events);
  const plans = [
    ...planDeadlineActions(snapshot, now),
    ...planRecommendedWindowActions(snapshot, events, now)
  ];
  const results = [];

  for (const plan of plans) {
    let lifecycleCommitted = true;
    for (const step of plan.steps) {
      if (step.kind === 'expired-notification' && !lifecycleCommitted) break;
      try {
        const result = step.kind === 'challenge-expiry'
          ? await store.expireChallenge(
              { quest_id: plan.quest.id, contract_id: step.contract_id },
              step.context ?? CHALLENGE_CONTEXT,
              step.idempotencyKey
            )
          : await store.applyAction(step.action, step.context ?? ENGINE_CONTEXT, step.idempotencyKey);
        results.push({
          quest_id: plan.quest.id,
          kind: step.kind,
          replay: result.replay,
          event: result.event,
          ...(result.recovery_quest_id ? { recovery_quest_id: result.recovery_quest_id } : {})
        });
        if (['expiry', 'challenge-expiry'].includes(step.kind)) lifecycleCommitted = true;
        if (step.action?.type === 'notification.push') await onNotification(result.event);
      } catch (error) {
        if (['expiry', 'challenge-expiry'].includes(step.kind)) lifecycleCommitted = false;
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
