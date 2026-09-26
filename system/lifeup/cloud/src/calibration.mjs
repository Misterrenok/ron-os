export const CALIBRATION_REFS = Object.freeze({
  level: 'system-level-xp:v2',
  reward: 'system-quest-reward:v1',
  attribute: 'system-attribute-ordinal5:v1',
  skill: 'system-skill-competency5:v1',
  rank: 'system-rank-review:v1'
});

export const QUEST_REWARDS_V1 = Object.freeze({
  E: Object.freeze({ xp: 5, coins: 0 }),
  D: Object.freeze({ xp: 10, coins: 0 }),
  C: Object.freeze({ xp: 20, coins: 1 }),
  B: Object.freeze({ xp: 40, coins: 2 }),
  A: Object.freeze({ xp: 80, coins: 4 }),
  S: Object.freeze({ xp: 160, coins: 8 })
});

export function rewardForQuestRank(rank) {
  const reward = QUEST_REWARDS_V1[rank];
  if (!reward) throw new Error(`unsupported quest rank for calibrated reward: ${rank}`);
  return { ...reward };
}

export const LEVEL_XP_V2 = Object.freeze({
  base_xp: 100,
  growth_numerator: 112,
  growth_denominator: 100,
  quantum_xp: 5
});

function nextLevelSpan(span) {
  const value = Number(span);
  if (!Number.isSafeInteger(value) || value < LEVEL_XP_V2.quantum_xp) throw new Error('level span must be a positive safe integer');
  const scaled = value * LEVEL_XP_V2.growth_numerator;
  if (!Number.isSafeInteger(scaled)) throw new Error('level curve exceeds safe integer range');
  return Math.floor((scaled + (LEVEL_XP_V2.quantum_xp * LEVEL_XP_V2.growth_denominator) / 2)
    / (LEVEL_XP_V2.quantum_xp * LEVEL_XP_V2.growth_denominator)) * LEVEL_XP_V2.quantum_xp;
}

export function xpRequiredForNextLevel(level) {
  const value = Number(level);
  if (!Number.isSafeInteger(value) || value < 1) throw new Error('level must be a positive safe integer');
  let span = LEVEL_XP_V2.base_xp;
  for (let current = 1; current < value; current += 1) span = nextLevelSpan(span);
  return span;
}

export function minimumXpForLevel(level) {
  const value = Number(level);
  if (!Number.isSafeInteger(value) || value < 1) throw new Error('level must be a positive safe integer');
  let threshold = 0;
  let span = LEVEL_XP_V2.base_xp;
  for (let current = 1; current < value; current += 1) {
    if (threshold > Number.MAX_SAFE_INTEGER - span) throw new Error('level curve exceeds safe integer range');
    threshold += span;
    span = nextLevelSpan(span);
  }
  return threshold;
}

export function levelSnapshotForXp(xp) {
  const value = Number(xp);
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('xp must be a non-negative safe integer');
  let level = 1;
  let floorXp = 0;
  let span = LEVEL_XP_V2.base_xp;
  while (value >= floorXp + span) {
    floorXp += span;
    level += 1;
    span = nextLevelSpan(span);
  }
  const nextThreshold = floorXp + span;
  return {
    level,
    xp_to_next: nextThreshold - value,
    current_level_floor_xp: floorXp,
    next_level_threshold_xp: nextThreshold,
    level_span_xp: span,
    xp_into_level: value - floorXp,
    level_policy_ref: CALIBRATION_REFS.level
  };
}

export function assertAttributeCalibration(value, scaleRef) {
  if (scaleRef !== CALIBRATION_REFS.attribute) throw new Error(`attribute scale_ref must be ${CALIBRATION_REFS.attribute}`);
  if (value == null) return null;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1 || number > 5) throw new Error('attribute value must be an integer from 1 to 5, or null');
  return number;
}

export function assertSkillCalibration(level, scaleRef) {
  if (level == null) {
    if (scaleRef != null && scaleRef !== CALIBRATION_REFS.skill) throw new Error(`skill scale_ref must be ${CALIBRATION_REFS.skill} when provided`);
    return null;
  }
  if (scaleRef !== CALIBRATION_REFS.skill) throw new Error(`skill scale_ref must be ${CALIBRATION_REFS.skill}`);
  const number = Number(level);
  if (!Number.isInteger(number) || number < 1 || number > 5) throw new Error('skill level must be an integer from 1 to 5, or null');
  return number;
}

function latestEconomyStatus(events) {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (event.event_type === 'profile.calibrated' && Object.prototype.hasOwnProperty.call(event.payload ?? {}, 'economy_status')) {
      return event.payload.economy_status;
    }
  }
  return 'UNCALIBRATED';
}

function awardedEvents(events) {
  return events.filter((event) => event.event_type === 'progression.awarded' && event.claim_status === 'verified');
}

function totalAwardedXp(events) {
  return awardedEvents(events).reduce((sum, event) => sum + Number(event.payload?.xp ?? 0), 0);
}

function assertRankReviewWindow(events) {
  const rewarded = awardedEvents(events);
  if (rewarded.length < 20) throw new Error('rank review requires at least 20 verified rewarded completions spanning 28 days');
  const timestamps = rewarded.map((event) => Date.parse(event.occurred_at)).filter(Number.isFinite).sort((a, b) => a - b);
  if (timestamps.length < 20 || timestamps.at(-1) - timestamps[0] < 28 * 24 * 60 * 60 * 1000) {
    throw new Error('rank review requires at least 20 verified rewarded completions spanning 28 days');
  }
}

function questCreatedForCompletion(events, completion) {
  const questId = completion?.payload?.quest_id;
  return events.find((event) => event.event_type === 'quest.created' && event.payload?.quest_id === questId);
}

export function validateCalibrationEventAgainstHistory(event, events) {
  if (event.event_type === 'quest.created') {
    const xp = event.payload?.reward_xp;
    const coins = event.payload?.reward_coins;
    const unscored = xp == null && coins == null;
    if (unscored) return;
    if (xp == null || coins == null) throw new Error('scored quest requires both reward_xp and reward_coins');
    if (latestEconomyStatus(events) !== 'CALIBRATED') throw new Error('scored quest requires calibrated economy');
    const expected = rewardForQuestRank(event.payload.rank);
    if (Number(xp) !== expected.xp || Number(coins) !== expected.coins) throw new Error('quest reward does not match system-quest-reward:v1');
    event.payload.reward_policy_ref = CALIBRATION_REFS.reward;
    return;
  }

  if (event.event_type === 'progression.awarded') {
    const completion = events.find((item) => item.event_id === event.payload?.basis_event_id);
    if (!completion) return;
    const created = questCreatedForCompletion(events, completion);
    if (!created) throw new Error('rewarded quest creation event is missing');
    if (created.payload?.reward_policy_ref !== CALIBRATION_REFS.reward) throw new Error('quest is not scored under system-quest-reward:v1');
    const expected = rewardForQuestRank(created.payload.rank);
    if (Number(event.payload.xp) !== expected.xp || Number(event.payload.coins) !== expected.coins) throw new Error('progression award does not match scored quest reward');
    event.payload.reward_policy_ref = CALIBRATION_REFS.reward;
    return;
  }

  if (event.event_type === 'profile.calibrated') {
    const payload = event.payload ?? {};
    const xp = totalAwardedXp(events);
    const derived = levelSnapshotForXp(xp);
    const calibratingEconomy = payload.economy_status === 'CALIBRATED';
    const touchesLevel = Object.prototype.hasOwnProperty.call(payload, 'level') || Object.prototype.hasOwnProperty.call(payload, 'xp_to_next');
    if (calibratingEconomy && (payload.level == null || payload.xp_to_next == null)) {
      throw new Error('economy calibration requires derived level and xp_to_next');
    }
    if (touchesLevel || calibratingEconomy) {
      if (Number(payload.level) !== derived.level || Number(payload.xp_to_next) !== derived.xp_to_next) {
        throw new Error('level/xp_to_next must match system-level-xp:v2');
      }
      payload.level_policy_ref = CALIBRATION_REFS.level;
    }
    if (calibratingEconomy) payload.reward_policy_ref = CALIBRATION_REFS.reward;
    if (payload.rank != null) {
      assertRankReviewWindow(events);
      payload.rank_policy_ref = CALIBRATION_REFS.rank;
    }
    return;
  }

  if (event.event_type === 'attribute.set') {
    event.payload.value = assertAttributeCalibration(event.payload?.value, event.payload?.scale_ref);
    return;
  }

  if (event.event_type === 'skill.upserted') {
    event.payload.level = assertSkillCalibration(event.payload?.level, event.payload?.scale_ref);
  }
}

export function applyCalibrationProjection(snapshot) {
  const next = structuredClone(snapshot);
  if (next.profile?.economy_status === 'CALIBRATED') {
    const derived = levelSnapshotForXp(next.profile.xp ?? 0);
    next.profile.level = derived.level;
    next.profile.xp_to_next = derived.xp_to_next;
    next.profile.current_level_floor_xp = derived.current_level_floor_xp;
    next.profile.next_level_threshold_xp = derived.next_level_threshold_xp;
    next.profile.level_span_xp = derived.level_span_xp;
    next.profile.xp_into_level = derived.xp_into_level;
    next.profile.level_policy_ref = CALIBRATION_REFS.level;
    next.profile.reward_policy_ref = CALIBRATION_REFS.reward;
  }
  if (next.profile?.rank != null) next.profile.rank_policy_ref = CALIBRATION_REFS.rank;
  return next;
}
