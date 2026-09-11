import { CALIBRATION_REFS, rewardForQuestRank } from './calibration.mjs';

export const DIFFICULTY_POLICY_REF = 'system-quest-difficulty:v1';

export const DIFFICULTY_BANDS = Object.freeze([
  Object.freeze({ rank: 'E', min: 0, max: 1 }),
  Object.freeze({ rank: 'D', min: 2, max: 3 }),
  Object.freeze({ rank: 'C', min: 4, max: 6 }),
  Object.freeze({ rank: 'B', min: 7, max: 9 }),
  Object.freeze({ rank: 'A', min: 10, max: 12 }),
  Object.freeze({ rank: 'S', min: 13, max: 15 })
]);

const REQUIRED_ANCHORS = ['effort', 'friction', 'complexity', 'stakes'];

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function validAnchor(value) {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= 500;
}

function effortPoints(activeMinutes) {
  if (activeMinutes <= 15) return 0;
  if (activeMinutes <= 45) return 1;
  if (activeMinutes <= 120) return 2;
  if (activeMinutes <= 240) return 3;
  if (activeMinutes <= 480) return 4;
  if (activeMinutes <= 960) return 5;
  if (activeMinutes <= 1920) return 6;
  return 7;
}

function rankForScore(score) {
  return DIFFICULTY_BANDS.find((band) => score >= band.min && score <= band.max)?.rank;
}

function unscored(reasons) {
  return {
    scored: false,
    rank: null,
    score: null,
    reward_xp: null,
    reward_coins: null,
    difficulty_policy_ref: DIFFICULTY_POLICY_REF,
    reward_policy_ref: null,
    reasons
  };
}

function requireOrdinal(input, field, max) {
  if (!hasOwn(input, field)) return null;
  const value = Number(input[field]);
  if (!Number.isInteger(value) || value < 0 || value > max) {
    throw new Error(`${field} must be an integer from 0 to ${max}`);
  }
  return value;
}

export function classifyQuestDifficulty(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('difficulty input must be an object');
  }

  const reasons = [];
  const outcomeKey = typeof input.outcome_key === 'string' ? input.outcome_key.trim() : '';
  if (!outcomeKey || outcomeKey.length > 200) reasons.push('OUTCOME_KEY_REQUIRED');
  if (input.safe !== true) reasons.push('UNSAFE_OR_UNCONFIRMED');
  if (input.independently_valuable !== true) reasons.push('NOT_INDEPENDENT_OUTCOME');
  if (input.artificial_split === true) reasons.push('ARTIFICIAL_SPLIT');
  if (input.inflated_effort === true) reasons.push('INFLATED_EFFORT');

  const existingOutcomeKeys = input.existing_outcome_keys ?? [];
  if (!Array.isArray(existingOutcomeKeys) || existingOutcomeKeys.some((value) => typeof value !== 'string')) {
    throw new Error('existing_outcome_keys must be an array of strings');
  }
  if (outcomeKey && existingOutcomeKeys.includes(outcomeKey)) reasons.push('DUPLICATE_OUTCOME');

  if (!['high', 'medium', 'low'].includes(input.confidence)) reasons.push('CONFIDENCE_REQUIRED');
  else if (input.confidence === 'low') reasons.push('LOW_CONFIDENCE');

  const activeMinutes = hasOwn(input, 'active_minutes') ? Number(input.active_minutes) : null;
  if (activeMinutes == null) reasons.push('ACTIVE_MINUTES_REQUIRED');
  else if (!Number.isInteger(activeMinutes) || activeMinutes < 1 || activeMinutes > 1_000_000) {
    throw new Error('active_minutes must be an integer from 1 to 1000000');
  }

  const friction = requireOrdinal(input, 'friction', 3);
  const complexity = requireOrdinal(input, 'complexity', 3);
  const stakes = requireOrdinal(input, 'stakes', 2);
  if (friction == null) reasons.push('FRICTION_REQUIRED');
  if (complexity == null) reasons.push('COMPLEXITY_REQUIRED');
  if (stakes == null) reasons.push('STAKES_REQUIRED');

  const anchors = input.anchors && typeof input.anchors === 'object' && !Array.isArray(input.anchors)
    ? input.anchors
    : {};
  const missingAnchors = REQUIRED_ANCHORS.filter((key) => !validAnchor(anchors[key]));
  if (missingAnchors.length) reasons.push(`MISSING_ANCHORS:${missingAnchors.join(',')}`);

  if (reasons.length) return unscored(reasons);

  const effort = effortPoints(activeMinutes);
  const score = effort + friction + complexity + stakes;
  const rank = rankForScore(score);
  if (!rank) throw new Error(`difficulty score is outside policy bands: ${score}`);
  const reward = rewardForQuestRank(rank);

  return {
    scored: true,
    rank,
    score,
    reward_xp: reward.xp,
    reward_coins: reward.coins,
    difficulty_policy_ref: DIFFICULTY_POLICY_REF,
    reward_policy_ref: CALIBRATION_REFS.reward,
    reasons: [],
    breakdown: {
      active_minutes: activeMinutes,
      effort_points: effort,
      friction,
      complexity,
      stakes,
      confidence: input.confidence,
      outcome_key: outcomeKey,
      anchors: Object.fromEntries(REQUIRED_ANCHORS.map((key) => [key, anchors[key].trim()]))
    }
  };
}
