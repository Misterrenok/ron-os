import { createHash } from 'node:crypto';
import { levelSnapshotForXp } from './calibration.mjs';

export const PLAYER_FEEDBACK_POLICY_REF = 'system-player-feedback:v1';
export const PLAYER_FEEDBACK_ACTIVATED_AT = '2026-09-26T06:40:00.000Z';
export const DEFAULT_PLAYER_FEEDBACK_INTERVAL_MS = 30_000;

function stableId(prefix, eventId) {
  const suffix = createHash('sha256').update(String(eventId || '')).digest('hex').slice(0, 32);
  return `${prefix}-${suffix}`;
}

function afterActivation(event, activationAt) {
  const at = new Date(event?.occurred_at).getTime();
  const floor = new Date(activationAt).getTime();
  return Number.isFinite(at) && Number.isFinite(floor) && at >= floor;
}

function rewardBody({ xp, coins, before, after }) {
  const parts = [];
  if (xp) parts.push(`+${xp} XP`);
  if (coins) parts.push(`+${coins} ${coins === 1 ? 'монета' : coins < 5 ? 'монеты' : 'монет'}`);
  if (after.level > before.level) {
    parts.push(`Уровень ${before.level} → ${after.level}`);
  } else {
    parts.push(`До уровня ${after.level + 1}: ${after.xp_to_next} XP`);
  }
  return parts.join(' · ');
}

function rewardPlan(event, totalXpBefore) {
  const xp = Number(event?.payload?.xp || 0);
  const coins = Number(event?.payload?.coins || 0);
  const before = levelSnapshotForXp(totalXpBefore);
  const after = levelSnapshotForXp(totalXpBefore + xp);
  const notificationId = stableId('player-feedback-reward', event.event_id);
  const title = after.level > before.level
    ? `Уровень повышен: ${after.level}`
    : xp > 0
      ? `Получено ${xp} опыта`
      : 'Награда получена';
  return {
    source_event_id: event.event_id,
    notification_id: notificationId,
    context: { actor: 'system', source: 'system-player-feedback-engine', sourceRef: `policy:${PLAYER_FEEDBACK_POLICY_REF}` },
    idempotencyKey: `${PLAYER_FEEDBACK_POLICY_REF}:reward:${event.event_id}`,
    action: {
      type: 'notification.push',
      payload: {
        notification_id: notificationId,
        title: title.slice(0, 180),
        body: rewardBody({ xp, coins, before, after }).slice(0, 1200),
        severity: 'SUCCESS',
        kind: 'REWARD'
      }
    }
  };
}

function achievementPlan(event) {
  const notificationId = stableId('player-feedback-achievement', event.event_id);
  const title = String(event?.payload?.title || 'Новое достижение').trim();
  const description = String(event?.payload?.description || '').trim();
  const rank = String(event?.payload?.rank || '').trim();
  const body = [rank ? `Ранг ${rank}` : '', description].filter(Boolean).join(' · ') || 'Подтверждён новый этап.';
  return {
    source_event_id: event.event_id,
    notification_id: notificationId,
    context: { actor: 'system', source: 'system-player-feedback-engine', sourceRef: `policy:${PLAYER_FEEDBACK_POLICY_REF}` },
    idempotencyKey: `${PLAYER_FEEDBACK_POLICY_REF}:achievement:${event.event_id}`,
    action: {
      type: 'notification.push',
      payload: {
        notification_id: notificationId,
        title: `Достижение открыто: ${title}`.slice(0, 180),
        body: body.slice(0, 1200),
        severity: 'SUCCESS',
        kind: 'ACHIEVEMENT'
      }
    }
  };
}

export function planPlayerFeedbackActions(events = [], { activationAt = PLAYER_FEEDBACK_ACTIVATED_AT } = {}) {
  const ordered = [...events].sort((a,b) => Number(a?.seq || 0) - Number(b?.seq || 0));
  const existingNotifications = new Set(
    ordered.filter((event) => event?.event_type === 'notification.pushed')
      .map((event) => event?.payload?.notification_id)
      .filter(Boolean)
  );
  const plans = [];
  let totalXp = 0;

  for (const event of ordered) {
    if (event?.event_type === 'progression.awarded') {
      const xp = Number(event?.payload?.xp || 0);
      if (afterActivation(event, activationAt)) {
        const plan = rewardPlan(event, totalXp);
        if (!existingNotifications.has(plan.notification_id)) plans.push(plan);
      }
      totalXp += xp;
      continue;
    }
    if (event?.event_type === 'achievement.unlocked' && afterActivation(event, activationAt)) {
      const plan = achievementPlan(event);
      if (!existingNotifications.has(plan.notification_id)) plans.push(plan);
    }
  }
  return plans;
}

export async function runPlayerFeedbackSweep({ store, onNotification = async () => {}, activationAt = PLAYER_FEEDBACK_ACTIVATED_AT } = {}) {
  const events = await store.listAllEvents();
  const plans = planPlayerFeedbackActions(events, { activationAt });
  const results = [];
  for (const plan of plans) {
    try {
      const result = await store.applyAction(plan.action, plan.context, plan.idempotencyKey);
      results.push({ source_event_id: plan.source_event_id, notification_id: plan.notification_id, replay: result.replay, event: result.event });
      await onNotification(result.event);
    } catch (error) {
      results.push({ source_event_id: plan.source_event_id, notification_id: plan.notification_id, error });
    }
  }
  return results;
}

export function startPlayerFeedbackEngine({
  store,
  intervalMs = DEFAULT_PLAYER_FEEDBACK_INTERVAL_MS,
  onNotification,
  onError = console.error
} = {}) {
  let running = false;
  let stopped = false;
  const safeInterval = Math.max(5_000, Number(intervalMs) || DEFAULT_PLAYER_FEEDBACK_INTERVAL_MS);
  const tick = async () => {
    if (running || stopped) return [];
    running = true;
    try { return await runPlayerFeedbackSweep({ store, onNotification }); }
    catch (error) { onError(error); return []; }
    finally { running = false; }
  };
  void tick();
  const timer = setInterval(() => void tick(), safeInterval);
  timer.unref?.();
  return { runNow: tick, stop() { stopped = true; clearInterval(timer); } };
}
