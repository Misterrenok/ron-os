import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DIFFICULTY_POLICY_REF,
  classifyQuestDifficulty
} from '../src/difficulty.mjs';

function candidate(overrides = {}) {
  return {
    outcome_key: 'domain:independent-outcome:v1',
    independently_valuable: true,
    safe: true,
    artificial_split: false,
    inflated_effort: false,
    existing_outcome_keys: [],
    confidence: 'high',
    active_minutes: 10,
    friction: 0,
    complexity: 0,
    stakes: 0,
    anchors: {
      effort: 'active work estimate excluding waiting and avoidable inefficiency',
      friction: 'current 28-day baseline',
      complexity: 'known steps and dependencies',
      stakes: 'concrete reversible consequence'
    },
    ...overrides
  };
}

test('v1 assigns every inclusive E-S score boundary deterministically', () => {
  const cases = [
    [{ active_minutes: 10 }, 'E', 0, 5, 0],
    [{ active_minutes: 30 }, 'E', 1, 5, 0],
    [{ active_minutes: 60 }, 'D', 2, 10, 0],
    [{ active_minutes: 180 }, 'D', 3, 10, 0],
    [{ active_minutes: 300 }, 'C', 4, 20, 1],
    [{ active_minutes: 900, friction: 1 }, 'C', 6, 20, 1],
    [{ active_minutes: 1000, friction: 1 }, 'B', 7, 40, 2],
    [{ active_minutes: 2000, friction: 2 }, 'B', 9, 40, 2],
    [{ active_minutes: 2000, friction: 3 }, 'A', 10, 80, 4],
    [{ active_minutes: 2000, friction: 3, complexity: 2 }, 'A', 12, 80, 4],
    [{ active_minutes: 2000, friction: 3, complexity: 3 }, 'S', 13, 160, 8],
    [{ active_minutes: 2000, friction: 3, complexity: 3, stakes: 2 }, 'S', 15, 160, 8]
  ];

  for (const [overrides, rank, score, xp, coins] of cases) {
    const result = classifyQuestDifficulty(candidate(overrides));
    assert.equal(result.scored, true);
    assert.equal(result.rank, rank);
    assert.equal(result.score, score);
    assert.equal(result.reward_xp, xp);
    assert.equal(result.reward_coins, coins);
    assert.equal(result.difficulty_policy_ref, DIFFICULTY_POLICY_REF);
    assert.equal(result.reward_policy_ref, 'system-quest-reward:v1');
  }
});

test('active-effort buckets exclude waiting and stop growing after the S-relevant ceiling', () => {
  assert.equal(classifyQuestDifficulty(candidate({ active_minutes: 15 })).breakdown.effort_points, 0);
  assert.equal(classifyQuestDifficulty(candidate({ active_minutes: 16 })).breakdown.effort_points, 1);
  assert.equal(classifyQuestDifficulty(candidate({ active_minutes: 1920 })).breakdown.effort_points, 6);
  assert.equal(classifyQuestDifficulty(candidate({ active_minutes: 1921 })).breakdown.effort_points, 7);
  assert.equal(classifyQuestDifficulty(candidate({ active_minutes: 100000 })).breakdown.effort_points, 7);
});

test('missing evidence and low confidence stay UNSCORED with no reward', () => {
  const result = classifyQuestDifficulty(candidate({
    confidence: 'low',
    anchors: { effort: 'estimate only' }
  }));
  assert.equal(result.scored, false);
  assert.equal(result.rank, null);
  assert.equal(result.reward_xp, null);
  assert.equal(result.reward_coins, null);
  assert.deepEqual(result.reasons, [
    'LOW_CONFIDENCE',
    'MISSING_ANCHORS:friction,complexity,stakes'
  ]);
});

test('unsafe, dependent, split, duplicate and inflated outcomes cannot be scored', () => {
  const result = classifyQuestDifficulty(candidate({
    safe: false,
    independently_valuable: false,
    artificial_split: true,
    inflated_effort: true,
    existing_outcome_keys: ['domain:independent-outcome:v1']
  }));
  assert.equal(result.scored, false);
  assert.deepEqual(result.reasons, [
    'UNSAFE_OR_UNCONFIRMED',
    'NOT_INDEPENDENT_OUTCOME',
    'ARTIFICIAL_SPLIT',
    'INFLATED_EFFORT',
    'DUPLICATE_OUTCOME'
  ]);
});

test('medium-confidence anchored inputs are scored but remain auditable', () => {
  const result = classifyQuestDifficulty(candidate({ confidence: 'medium', active_minutes: 60, friction: 1 }));
  assert.equal(result.scored, true);
  assert.equal(result.rank, 'D');
  assert.equal(result.breakdown.confidence, 'medium');
  assert.equal(result.breakdown.anchors.friction, 'current 28-day baseline');
});

test('malformed numeric inputs fail closed instead of being coerced into a rank', () => {
  assert.throws(() => classifyQuestDifficulty(candidate({ active_minutes: 0 })), /active_minutes/);
  assert.throws(() => classifyQuestDifficulty(candidate({ friction: 4 })), /friction/);
  assert.throws(() => classifyQuestDifficulty(candidate({ complexity: -1 })), /complexity/);
  assert.throws(() => classifyQuestDifficulty(candidate({ stakes: 3 })), /stakes/);
});
