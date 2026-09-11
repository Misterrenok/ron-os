export const CALIBRATION_REFS = Object.freeze({
  level: 'system-level-xp:v1',
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

export function minimumXpForLevel(level) {
  const value = Number(level);
  if (!Number.isSafeInteger(value) || value < 1) throw new Error('level must be a positive safe integer');
  return 250 * value * (value - 1);
}

export function levelSnapshotForXp(xp) {
  const value = Number(xp);
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('xp must be a non-negative safe integer');
  let level = Math.floor((1 + Math.sqrt(1 + (4 * value) / 250)) / 2);
  if (level < 1) level = 1;
  while (minimumXpForLevel(level + 1) <= value) level += 1;
  while (minimumXpForLevel(level) > value) level -= 1;
  const nextThreshold = minimumXpForLevel(level + 1);
  return {
    level,
    xp_to_next: nextThreshold - value,
    current_level_floor_xp: minimumXpForLevel(level),
    next_level_threshold_xp: nextThreshold,
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
