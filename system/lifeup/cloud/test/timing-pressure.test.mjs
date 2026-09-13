import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TIMING_POLICY_VERSION,
  buildRecommendedWindowSourceRef,
  parseRecommendedWindowSourceRef,
  deriveLatestRecommendedWindows,
  recommendedWindowDeclarationAction,
  normalizeChallengeContract,
  challengeRecoveryQuestId
} from '../src/timing-pressure.mjs';

test('recommended-window source refs round trip under Timing v2', () => {
  const ref = buildRecommendedWindowSourceRef({
    quest_id: 'q-1',
    target_at: '2026-09-13T20:00:00+03:00',
    reason: 'preferred window'
  });
  const parsed = parseRecommendedWindowSourceRef(ref);
  assert.equal(parsed.policy_ref, TIMING_POLICY_VERSION);
  assert.equal(parsed.quest_id, 'q-1');
  assert.equal(parsed.target_at, '2026-09-13T17:00:00.000Z');
  assert.equal(parsed.reason, 'preferred window');
  assert.equal(parsed.legacy, false);
});

test('legacy soft-target declarations remain readable as recommended-window evidence', () => {
  const events = [{
    seq: 15,
    event_id: 'legacy-event',
    event_type: 'notification.pushed',
    source_ref: 'system-soft-target:v1?quest=q-legacy&target=2026-09-12T18%3A30%3A00.000Z&reason=today'
  }];
  const target = deriveLatestRecommendedWindows(events).get('q-legacy');
  assert.equal(target.target_at, '2026-09-12T18:30:00.000Z');
  assert.equal(target.reason, 'today');
  assert.equal(target.legacy, true);
});

test('new declaration is player-facing recommended-window copy, not Soft Target copy', () => {
  const declaration = recommendedWindowDeclarationAction({
    quest: { id: 'q-2', title: 'Немецкий' },
    target_at: '2026-09-13T20:00:00+03:00'
  });
  assert.match(declaration.action.payload.title, /^Рекомендуемое окно:/);
  assert.match(declaration.action.payload.body, /ориентир/);
  assert.doesNotMatch(declaration.action.payload.title, /Мягкая цель/);
  assert.doesNotMatch(declaration.action.payload.body, /провал|награда утрачена/i);
});

test('challenge recovery contract is bounded and recovery id is deterministic', () => {
  const contract = normalizeChallengeContract({
    contract_id: 'challenge-1',
    recovery_title: 'Восстановить темп',
    recovery_objective: '15 минут вернуться к задаче',
    recovery_target: 1,
    recovery_unit: 'session'
  });
  assert.deepEqual(contract, {
    contract_id: 'challenge-1',
    recovery_title: 'Восстановить темп',
    recovery_objective: '15 минут вернуться к задаче',
    recovery_target: 1,
    recovery_unit: 'session'
  });
  assert.equal(challengeRecoveryQuestId('quest-1', 'challenge-1'), challengeRecoveryQuestId('quest-1', 'challenge-1'));
  assert.notEqual(challengeRecoveryQuestId('quest-1', 'challenge-1'), challengeRecoveryQuestId('quest-1', 'challenge-2'));
});
