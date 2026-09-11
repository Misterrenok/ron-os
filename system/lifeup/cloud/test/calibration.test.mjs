import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CALIBRATION_REFS,
  QUEST_REWARDS_V1,
  applyCalibrationProjection,
  assertAttributeCalibration,
  assertSkillCalibration,
  levelSnapshotForXp,
  minimumXpForLevel,
  rewardForQuestRank,
  validateCalibrationEventAgainstHistory
} from '../src/calibration.mjs';

test('level v1 starts at level 1 and follows the cumulative threshold formula', () => {
  assert.equal(minimumXpForLevel(1), 0);
  assert.equal(minimumXpForLevel(2), 500);
  assert.equal(minimumXpForLevel(3), 1500);
  assert.equal(minimumXpForLevel(10), 22500);
  assert.deepEqual(levelSnapshotForXp(0), {
    level: 1,
    xp_to_next: 500,
    current_level_floor_xp: 0,
    next_level_threshold_xp: 500,
    level_policy_ref: CALIBRATION_REFS.level
  });
  assert.equal(levelSnapshotForXp(499).level, 1);
  assert.equal(levelSnapshotForXp(500).level, 2);
  assert.equal(levelSnapshotForXp(1499).level, 2);
  assert.equal(levelSnapshotForXp(1500).level, 3);
  assert.equal(levelSnapshotForXp(3000).level, 4);
});

test('quest reward v1 is deterministic and gives no coins for E/D', () => {
  assert.deepEqual(QUEST_REWARDS_V1, {
    E: { xp: 5, coins: 0 },
    D: { xp: 10, coins: 0 },
    C: { xp: 20, coins: 1 },
    B: { xp: 40, coins: 2 },
    A: { xp: 80, coins: 4 },
    S: { xp: 160, coins: 8 }
  });
  assert.deepEqual(rewardForQuestRank('B'), { xp: 40, coins: 2 });
  assert.throws(() => rewardForQuestRank('X'), /unsupported quest rank/);
});

test('attribute v1 uses only null or ordinal 1..5 with exact scale ref', () => {
  assert.equal(assertAttributeCalibration(null, CALIBRATION_REFS.attribute), null);
  assert.equal(assertAttributeCalibration(1, CALIBRATION_REFS.attribute), 1);
  assert.equal(assertAttributeCalibration(5, CALIBRATION_REFS.attribute), 5);
  assert.throws(() => assertAttributeCalibration(0, CALIBRATION_REFS.attribute), /1 to 5/);
  assert.throws(() => assertAttributeCalibration(6, CALIBRATION_REFS.attribute), /1 to 5/);
  assert.throws(() => assertAttributeCalibration(3, 'made-up-scale'), /scale_ref/);
});

test('skill v1 allows unknown level but numeric tiers require canonical 1..5 scale', () => {
  assert.equal(assertSkillCalibration(null, null), null);
  assert.equal(assertSkillCalibration(null, CALIBRATION_REFS.skill), null);
  assert.equal(assertSkillCalibration(3, CALIBRATION_REFS.skill), 3);
  assert.throws(() => assertSkillCalibration(0, CALIBRATION_REFS.skill), /1 to 5/);
  assert.throws(() => assertSkillCalibration(2, 'other'), /scale_ref/);
});

test('launch calibration derives level metadata and rank remains gated', () => {
  const launch = {
    event_type: 'profile.calibrated',
    payload: { level: 1, xp_to_next: 500, economy_status: 'CALIBRATED' }
  };
  validateCalibrationEventAgainstHistory(launch, []);
  assert.equal(launch.payload.level_policy_ref, CALIBRATION_REFS.level);
  assert.equal(launch.payload.reward_policy_ref, CALIBRATION_REFS.reward);

  const earlyRank = { event_type: 'profile.calibrated', payload: { rank: 'E' } };
  assert.throws(() => validateCalibrationEventAgainstHistory(earlyRank, []), /20 verified rewarded completions spanning 28 days/);
});

test('scored quests are impossible before economy calibration and deterministic afterwards', () => {
  const scored = {
    event_type: 'quest.created',
    payload: { quest_id: 'q', rank: 'C', reward_xp: 20, reward_coins: 1 }
  };
  assert.throws(() => validateCalibrationEventAgainstHistory(scored, []), /calibrated economy/);

  const history = [{
    event_type: 'profile.calibrated',
    claim_status: 'verified',
    occurred_at: '2026-09-11T00:00:00.000Z',
    payload: { level: 1, xp_to_next: 500, economy_status: 'CALIBRATED' }
  }];
  validateCalibrationEventAgainstHistory(scored, history);
  assert.equal(scored.payload.reward_policy_ref, CALIBRATION_REFS.reward);

  const wrong = { event_type: 'quest.created', payload: { quest_id: 'bad', rank: 'C', reward_xp: 99, reward_coins: 1 } };
  assert.throws(() => validateCalibrationEventAgainstHistory(wrong, history), /does not match/);
});

test('calibrated projection derives level from cumulative XP rather than stale stored level', () => {
  const snapshot = {
    profile: { economy_status: 'CALIBRATED', xp: 500, level: 1, xp_to_next: 1, rank: null }
  };
  const projected = applyCalibrationProjection(snapshot);
  assert.equal(projected.profile.level, 2);
  assert.equal(projected.profile.xp_to_next, 1000);
  assert.equal(projected.profile.level_policy_ref, CALIBRATION_REFS.level);
  assert.equal(projected.profile.reward_policy_ref, CALIBRATION_REFS.reward);
});
