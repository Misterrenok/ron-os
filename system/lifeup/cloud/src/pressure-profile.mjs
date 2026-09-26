export const PRESSURE_PROFILE_REF = 'system-pressure-profile:v1';
export const PRESSURE_PROFILE_ACTIVATED_AT = '2026-09-26T00:00:00+03:00';
export const PRESSURE_PROFILE_REVIEW_AT = '2026-10-17T00:00:00+03:00';
export const PRESSURE_MAX_STARTS_7D = 2;
export const PRESSURE_REVIEW_OUTCOMES = 6;
export const PRESSURE_STOP_MISSES_LAST5 = 3;

const TERMINAL_TYPES = new Set(['quest.completed','quest.cancelled','quest.failed','quest.expired']);

function challengeDeclarations(events) {
  return events
    .filter((event) => event?.event_type === 'challenge.declared' && event?.payload?.quest_id)
    .sort((a,b) => Number(a.seq || 0) - Number(b.seq || 0));
}

function terminalFor(events, questId) {
  return events.find((event) => TERMINAL_TYPES.has(event?.event_type) && event?.payload?.quest_id === questId) ?? null;
}

export function pressureProfileStatus(events = [], { now = Date.now() } = {}) {
  const nowMs = now instanceof Date ? now.getTime() : new Date(now).getTime();
  if (!Number.isFinite(nowMs)) throw new Error('now must be a valid timestamp');
  const declarations = challengeDeclarations(events);
  const outcomes = declarations
    .map((event) => ({ declaration: event, terminal: terminalFor(events, event.payload.quest_id) }))
    .filter((item) => item.terminal)
    .sort((a,b) => Number(a.terminal.seq || 0) - Number(b.terminal.seq || 0));
  const active = declarations.filter((event) => !terminalFor(events, event.payload.quest_id));
  const since = nowMs - 7 * 24 * 60 * 60 * 1000;
  const starts7d = declarations.filter((event) => new Date(event.occurred_at).getTime() >= since).length;
  const last5 = outcomes.slice(-5);
  const missesLast5 = last5.filter((item) => item.terminal.event_type === 'quest.expired').length;
  const reviewRequired = outcomes.length >= PRESSURE_REVIEW_OUTCOMES || nowMs >= new Date(PRESSURE_PROFILE_REVIEW_AT).getTime();
  const stopTriggered = last5.length >= 5 && missesLast5 >= PRESSURE_STOP_MISSES_LAST5;
  return {
    policy_ref: PRESSURE_PROFILE_REF,
    active_challenges: active.length,
    starts_7d: starts7d,
    completed_outcomes: outcomes.length,
    misses_last5: missesLast5,
    review_required: reviewRequired,
    stop_triggered: stopTriggered,
    review_at: PRESSURE_PROFILE_REVIEW_AT
  };
}

export function evaluateChallengeAdmission(events = [], normalized, { now = Date.now() } = {}) {
  const status = pressureProfileStatus(events, { now });
  const quest = normalized?.quest || {};
  const reasons = [];
  if (!['MAIN','DAILY'].includes(quest.class)) reasons.push('standing pressure profile only admits MAIN/DAILY quests');
  if (quest.reward_xp == null) reasons.push('Challenge requires a scored quest under the standing profile');
  if (status.active_challenges >= 1) reasons.push('only one active Challenge is allowed');
  if (status.starts_7d >= PRESSURE_MAX_STARTS_7D) reasons.push('rolling seven-day Challenge limit reached');
  if (status.review_required) reasons.push('pressure profile review is required before another Challenge');
  if (status.stop_triggered) reasons.push('automatic Challenge selection stopped after excessive recent misses');
  return { allowed: reasons.length === 0, reasons, status };
}
