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

  const winDates = new Set(
    events
      .filter((event) => isVerifiedExecution(event, questIds))
      .map((event) => localDateKey(event.occurred_at))
      .filter((date) => date && date >= activationDate)
  );

  const reminderDates = new Set(
    events
      .filter((event) => isPlayerExecutionReminder(event, questIds))
      .map((event) => localDateKey(event.payload.remind_at))
      .filter((date) => date && date >= activationDate)
  );

  const challengeDates = new Set(
    events
      .filter((event) => event?.event_type === 'challenge.declared' && questIds.has(event.payload?.quest_id))
      .map((event) => localDateKey(event.payload?.deadline_at))
      .filter((date) => date && date >= activationDate)
  );

  const forcedBreakDates = new Set(
    events
      .filter((event) => event?.event_type === 'quest.expired' && challengeIds.has(event.payload?.quest_id))
      .map((event) => localDateKey(event.occurred_at))
      .filter((date) => date && date >= activationDate)
  );

  const eligibleDates = uniqueSorted([...winDates, ...reminderDates, ...challengeDates]).filter((date) => date <= today);
  let current = 0;
  let best = 0;
  let misses = 0;
  let wins = 0;
  let lastWinDate = null;
  let lastMissDate = null;

  for (const date of eligibleDates) {
    const isToday = date === today;
    const forcedBreak = forcedBreakDates.has(date);
    const win = winDates.has(date);

    if (forcedBreak) {
      current = 0;
      misses += 1;
      lastMissDate = date;
      continue;
    }
    if (win) {
      current += 1;
      wins += 1;
      best = Math.max(best, current);
      lastWinDate = date;
      continue;
    }
    if (!isToday) {
      current = 0;
      misses += 1;
      lastMissDate = date;
    }
  }

  const todayEligible = eligibleDates.includes(today);
  const todayWin = winDates.has(today) && !forcedBreakDates.has(today);
  const todayForcedBreak = forcedBreakDates.has(today);
  const status = todayForcedBreak
    ? 'BROKEN_TODAY'
    : todayWin
      ? 'SECURED_TODAY'
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
      forced_break: todayForcedBreak
    },
    history: {
      wins,
      misses,
      last_win_date: lastWinDate,
      last_miss_date: lastMissDate
    },
    next_milestone: nextMilestone,
    pressure: {
      challenge_completed: challengeCompleted,
      challenge_missed: challengeMissed,
      challenge_total: challengeCompleted + challengeMissed
    }
  };
}
