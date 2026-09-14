import { createHash } from 'node:crypto';
import { parseSoftTargetSourceRef } from './soft-target.mjs';

export const TIMING_POLICY_VERSION = 'system-timing:v2';
export const RECOMMENDED_WINDOW_REMINDER_LEAD_MS = 60 * 60_000;
const PREFIX = `${TIMING_POLICY_VERSION}?`;

function requireText(value, field, max = 200) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field} is required`);
  const normalized = value.trim();
  if (normalized.length > max) throw new Error(`${field} is too long`);
  return normalized;
}

export function normalizeRecommendedWindow(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('recommended window input must be an object');
  const questId = requireText(input.quest_id, 'quest_id', 100);
  const parsed = new Date(input.target_at);
  if (Number.isNaN(parsed.getTime())) throw new Error('target_at must be a valid timestamp');
  return {
    quest_id: questId,
    target_at: parsed.toISOString(),
    reason: input.reason == null ? '' : String(input.reason).trim().slice(0, 500)
  };
}

export function buildRecommendedWindowSourceRef(input) {
  const target = normalizeRecommendedWindow(input);
  const params = new URLSearchParams({
    mode: 'RECOMMENDED_WINDOW',
    quest: target.quest_id,
    target: target.target_at
  });
  if (target.reason) params.set('reason', target.reason);
  return `${PREFIX}${params.toString()}`;
}

export function parseRecommendedWindowSourceRef(value) {
  if (typeof value !== 'string' || !value.startsWith(PREFIX)) return null;
  const params = new URLSearchParams(value.slice(PREFIX.length));
  if (params.get('mode') !== 'RECOMMENDED_WINDOW') return null;
  const questId = params.get('quest');
  const targetValue = params.get('target');
  if (!questId || questId.length > 100 || !targetValue) return null;
  const target = new Date(targetValue);
  if (Number.isNaN(target.getTime())) return null;
  return {
    policy_ref: TIMING_POLICY_VERSION,
    quest_id: questId,
    target_at: target.toISOString(),
    reason: (params.get('reason') || '').slice(0, 500),
    legacy: false
  };
}

export function deriveLatestRecommendedWindows(events = []) {
  const latest = new Map();
  for (const event of events) {
    if (event?.event_type !== 'notification.pushed') continue;
    const parsed = parseRecommendedWindowSourceRef(event.source_ref)
      ?? (() => {
        const legacy = parseSoftTargetSourceRef(event.source_ref);
        return legacy ? { ...legacy, legacy: true } : null;
      })();
    if (!parsed) continue;
    const seq = Number(event.seq ?? 0);
    const prior = latest.get(parsed.quest_id);
    if (!prior || seq >= prior.seq) latest.set(parsed.quest_id, { ...parsed, seq, event_id: event.event_id });
  }
  return latest;
}

export function timingNotificationId(kind, questId, targetAt) {
  const suffix = createHash('sha256').update(`${kind}\u0000${questId}\u0000${targetAt}`).digest('hex').slice(0, 32);
  return `timing-${kind}-${suffix}`;
}

export function recommendedWindowDeclarationAction({ quest, target_at, reason = '' }) {
  if (!quest?.id || !quest?.title) throw new Error('active quest is required');
  const target = normalizeRecommendedWindow({ quest_id: quest.id, target_at, reason });
  return {
    source_ref: buildRecommendedWindowSourceRef(target),
    action: {
      type: 'notification.push',
      payload: {
        notification_id: timingNotificationId('recommended-set', target.quest_id, target.target_at),
        title: `Рекомендуемое окно: ${quest.title}`.slice(0, 180),
        body: `Лучшее окно — до ${new Date(target.target_at).toLocaleString('ru-RU', { timeZone: 'Europe/Istanbul', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}. Это ориентир, а не условие провала.`.slice(0, 1200),
        severity: 'INFO',
        kind: 'QUEST'
      }
    }
  };
}
