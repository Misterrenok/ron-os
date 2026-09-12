import { createHash } from 'node:crypto';

export const ACHIEVEMENT_POLICY_REF = 'system-achievement-ledger:v1';

export const ACHIEVEMENT_MILESTONES = Object.freeze([
  Object.freeze({
    achievement_id: 'system-achievement-first-verified-win-v1',
    title: 'Первый подтверждённый шаг',
    description: 'Первое подтверждённое и вознаграждённое задание Quest v2.',
    rank: 'E',
    count: 1,
    min_span_days: 0
  }),
  Object.freeze({
    achievement_id: 'system-achievement-five-verified-wins-v1',
    title: 'Пять подтверждённых побед',
    description: 'Пять разных подтверждённых и вознаграждённых заданий Quest v2.',
    rank: 'D',
    count: 5,
    min_span_days: 0
  }),
  Object.freeze({
    achievement_id: 'system-achievement-consistency-20x28-v1',
    title: 'Доказанная устойчивость',
    description: 'Двадцать подтверждённых и вознаграждённых заданий Quest v2 на горизонте не менее 28 дней.',
    rank: 'C',
    count: 20,
    min_span_days: 28
  })
]);

function normalizedEvents(events) {
  return Array.isArray(events) ? events : [];
}

function stableEventId(event) {
  return typeof event?.event_id === 'string' && event.event_id.trim() ? event.event_id.trim() : null;
}

function occurredAtMs(event) {
  const ms = Date.parse(event?.occurred_at ?? '');
  return Number.isFinite(ms) ? ms : null;
}

function qualifyingCompletions(events = []) {
  const input = normalizedEvents(events);
  const createsByQuest = new Map();
  const completionsById = new Map();
  const rewardedBasisIds = new Set();

  for (const event of input) {
    if (event?.event_type === 'quest.created' && event?.payload?.quest_id) {
      createsByQuest.set(event.payload.quest_id, event);
    }
    if (event?.event_type === 'quest.completed' && event?.claim_status === 'verified') {
      const id = stableEventId(event);
      if (id) completionsById.set(id, event);
    }
    if (event?.event_type === 'progression.awarded' && event?.claim_status === 'verified') {
      const basis = event?.payload?.basis_event_id;
      if (typeof basis === 'string' && basis.trim()) rewardedBasisIds.add(basis.trim());
    }
  }

  const result = [];
  for (const basisId of rewardedBasisIds) {
    const completion = completionsById.get(basisId);
    if (!completion) continue;
    const questId = completion?.payload?.quest_id;
    const create = questId ? createsByQuest.get(questId) : null;
    if (!create || create?.payload?.quest_id !== questId || create?.payload?.quest_version !== 2) continue;
    const timeMs = occurredAtMs(completion);
    if (timeMs == null) continue;
    result.push({
      completion_event_id: basisId,
      quest_id: questId,
      occurred_at: new Date(timeMs).toISOString(),
      occurred_at_ms: timeMs
    });
  }

  result.sort((a, b) => a.occurred_at_ms - b.occurred_at_ms || a.completion_event_id.localeCompare(b.completion_event_id));
  return result;
}

function evidenceRef(achievementId, completions) {
  const ids = completions.map((item) => item.completion_event_id).sort();
  const digest = createHash('sha256').update(ids.join('\n')).digest('hex');
  return `${ACHIEVEMENT_POLICY_REF};achievement=${achievementId};count=${ids.length};sha256=${digest}`;
}

function isUnlocked(events, achievementId) {
  return normalizedEvents(events).some(
    (event) => event?.event_type === 'achievement.unlocked' && event?.payload?.achievement_id === achievementId
  );
}

export function achievementEligibility(events = []) {
  const completions = qualifyingCompletions(events);
  const candidates = [];

  for (const milestone of ACHIEVEMENT_MILESTONES) {
    if (isUnlocked(events, milestone.achievement_id)) continue;
    if (completions.length < milestone.count) continue;

    const evidenceCompletions = milestone.min_span_days > 0
      ? completions
      : completions.slice(0, milestone.count);
    const spanMs = evidenceCompletions.at(-1).occurred_at_ms - evidenceCompletions[0].occurred_at_ms;
    const spanDays = spanMs / 86_400_000;
    if (spanDays < milestone.min_span_days) continue;

    const ref = evidenceRef(milestone.achievement_id, evidenceCompletions);
    candidates.push({
      policy_ref: ACHIEVEMENT_POLICY_REF,
      achievement_id: milestone.achievement_id,
      qualifying_count: evidenceCompletions.length,
      threshold_count: milestone.count,
      span_days: spanDays,
      basis_completion_event_ids: evidenceCompletions.map((item) => item.completion_event_id),
      requires_exact_mutation_permission: true,
      action: {
        type: 'achievement.unlock',
        payload: {
          achievement_id: milestone.achievement_id,
          title: milestone.title,
          description: milestone.description,
          rank: milestone.rank,
          evidence: {
            status: 'verified',
            source: 'system-ledger',
            ref
          }
        }
      }
    });
  }

  return candidates;
}

export function achievementSnapshot(events = []) {
  const qualifying = qualifyingCompletions(events);
  return {
    policy_ref: ACHIEVEMENT_POLICY_REF,
    verified_rewarded_quest_v2_completions: qualifying.length,
    first_completion_at: qualifying[0]?.occurred_at ?? null,
    latest_completion_at: qualifying.at(-1)?.occurred_at ?? null,
    candidates: achievementEligibility(events)
  };
}
