export const STREAK_POLICY_REF = 'system-execution-streak:v1';
export const STREAK_TIME_ZONE = 'Europe/Istanbul';
export const STREAK_ACTIVATED_AT = '2026-09-26T00:00:00+03:00';
export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100];

const TERMINAL_TYPES = new Set(['quest.completed','quest.cancelled','quest.failed','quest.expired']);

function localDateKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: STREAK_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type)?.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function isRealQuest(created) {
  return created?.event_type === 'quest.created'
    && created?.payload?.quest_version === 2
    && created?.payload?.visibility !== 'HIDDEN'
    && !String(created?.payload?.quest_id || '').includes('probe');
}

function isVerifiedExecution(event, questIds) {
  if (!questIds.has(event?.payload?.quest_id)) return false;
  if (event?.event_type === 'quest.progressed') return event.claim_status === 'verified';
  if (event?.event_type === 'quest.completed') return event.claim_status === 'verified';
  return false;
}

function isPlayerExecutionReminder(event, questIds) {
  if (event?.event_type !== 'reminder.scheduled') return false;
  const payload = event.payload || {};
  if (!questIds.has(payload.quest_id)) return false;
  const scheduleId = String(payload.schedule_id || '');
  const sourceRef = String(event.source_ref || '');
  if (scheduleId.startsWith('live-push-proof-') || sourceRef.includes('live-proof')) return false;
  return Boolean(payload.remind_at);
}

function challengeQuestIds(events) {
  return new Set(events.filter((event) => event?.event_type === 'challenge.declared').map((event) => event.payload?.quest_id).filter(Boolean));
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

export function deriveExecutionStreak(events = [], { now = Date.now() } = {}) {
  const nowDate = now instanceof Date ? now : new Date(now);
  if (Number.isNaN(nowDate.getTime())) throw new Error('now must be a valid timestamp');
  const today = localDateKey(nowDate);
  const activationDate = localDateKey(STREAK_ACTIVATED_AT);

  const created = events.filter(isRealQuest);
  const questIds = new Set(created.map((event) => event.payload.quest_id));
  const challengeIds = challengeQuestIds(events);
  const earliestTerminalAt = new Map();
  for (const event of events) {
    const questId = event?.payload?.quest_id;
    if (!questId || !TERMINAL_TYPES.has(event?.event_type)) continue;
    const at = new Date(event.occurred_at).getTime();
    if (!Number.isFinite(at)) continue;
    const prior = earliestTerminalAt.get(questId);
    if (prior == null || at < prior) earliestTerminalAt.set(questId, at);
  }
  const activeAt = (questId, timestamp) => {
    const at = new Date(timestamp).getTime();
    if (!Number.isFinite(at)) return false;
    const terminalAt = earliestTerminalAt.get(questId);
    return terminalAt == null || terminalAt > at;
  };

  const winDates = new Set(
    events
      .filter((event) => isVerifiedExecution(event, questIds))
      .map((event) => localDateKey(event.occurred_at))
      .filter((date) => date && date >= activationDate)
  );

  const reminderDates = new Set(
    events
      .filter((event) => isPlayerExecutionReminder(event, questIds))
      .filter((event) => activeAt(event.payload.quest_id, event.payload.remind_at))
      .map((event) => localDateKey(event.payload.remind_at))
      .filter((date) => date && date >= activationDate)
  );

  const challengeDates = new Set(
    events
      .filter((event) => event?.event_type === 'challenge.declared' && questIds.has(event.payload?.quest_id))
      .filter((event) => activeAt(event.payload.quest_id, event.payload.deadline_at))
      .map((event) => localDateKey(event.payload?.deadline_at))
      .filter((date) => date && date >= activationDate)
  );

  const forcedBreakDates = new Set(
    events
      .filter((event) => event?.event_type === 'quest.expired' && challengeIds.has(event.payload?.quest_id))
      .map((event) => localDateKey(event.occurred_at))
      .filter((date) => date && date >= activationDate)
  );

  const excusedDates = new Set(
    events
      .filter((event) => event?.event_type === 'streak.excused')
      .map((event) => String(event.payload?.local_date || ''))
      .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date) && date >= activationDate)
  );

  const eligibleDates = uniqueSorted([...winDates, ...reminderDates, ...challengeDates]).filter((date) => date <= today);
  let current = 0;
  let best = 0;
  let misses = 0;
  let wins = 0;
  let excused = 0;
  let lastWinDate = null;
  let lastMissDate = null;
  let lastExcusedDate = null;

  for (const date of eligibleDates) {
    const isToday = date === today;
    const forcedBreak = forcedBreakDates.has(date);
    const win = winDates.has(date);
    const protectedDay = excusedDates.has(date);

    if (forcedBreak && !protectedDay) {
      current = 0;
      misses += 1;
      lastMissDate = date;
      continue;
    }
    if (win && !forcedBreak) {
      current += 1;
      wins += 1;
      best = Math.max(best, current);
      lastWinDate = date;
      continue;
    }
    if (protectedDay) {
      excused += 1;
      lastExcusedDate = date;
      continue;
    }
    if (!isToday) {
      current = 0;
      misses += 1;
      lastMissDate = date;
    }
  }

  const todayEligible = eligibleDates.includes(today);
  const todayExcused = excusedDates.has(today);
  const todayForcedBreak = forcedBreakDates.has(today);
  const todayWin = winDates.has(today) && !todayForcedBreak;
  const status = todayForcedBreak && !todayExcused
    ? 'BROKEN_TODAY'
    : todayWin
      ? 'SECURED_TODAY'
      : todayExcused && todayEligible
        ? 'EXCUSED_TODAY'
        : todayEligible
          ? 'AT_RISK_TODAY'
          : 'NO_PLANNED_EXECUTION_TODAY';

  const nextMilestone = STREAK_MILESTONES.find((value) => value > current) ?? null;

  const challengeCompleted = events.filter((event) => event?.event_type === 'quest.completed' && challengeIds.has(event.payload?.quest_id)).length;
  const challengeMissed = events.filter((event) => event?.event_type === 'quest.expired' && challengeIds.has(event.payload?.quest_id)).length;

  return {
    policy_ref: STREAK_POLICY_REF,
    activated_at: STREAK_ACTIVATED_AT,
    time_zone: STREAK_TIME_ZONE,
    current,
    best,
    status,
    today: {
      date: today,
      eligible: todayEligible,
      secured: todayWin,
      excused: todayExcused,
      forced_break: todayForcedBreak
    },
    history: {
      wins,
      misses,
      excused,
      last_win_date: lastWinDate,
      last_miss_date: lastMissDate,
      last_excused_date: lastExcusedDate
    },
    next_milestone: nextMilestone,
    pressure: {
      challenge_completed: challengeCompleted,
      challenge_missed: challengeMissed,
      challenge_total: challengeCompleted + challengeMissed
    }
  };
}
