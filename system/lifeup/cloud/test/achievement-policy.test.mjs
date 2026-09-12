import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACHIEVEMENT_POLICY_REF,
  achievementEligibility,
  achievementSnapshot
} from '../src/achievement-policy.mjs';

function questBundle(index, occurredAt, {
  questVersion = 2,
  completionClaim = 'verified',
  rewarded = true
} = {}) {
  const questId = `quest-${index}`;
  const completionId = `completion-${index}`;
  const create = {
    event_id: `create-${index}`,
    event_type: 'quest.created',
    claim_status: 'derived',
    occurred_at: new Date(new Date(occurredAt).getTime() - 60_000).toISOString(),
    payload: { quest_id: questId, quest_version: questVersion }
  };
  const completion = {
    event_id: completionId,
    event_type: 'quest.completed',
    claim_status: completionClaim,
    occurred_at: new Date(occurredAt).toISOString(),
    payload: { quest_id: questId, evidence: { status: completionClaim } }
  };
  const award = {
    event_id: `award-${index}`,
    event_type: 'progression.awarded',
    claim_status: 'verified',
    occurred_at: new Date(new Date(occurredAt).getTime() + 1000).toISOString(),
    payload: { basis_event_id: completionId, xp: 5, coins: 0 }
  };
  return rewarded ? [create, completion, award] : [create, completion];
}

function bundles(count, { start = '2026-09-01T08:00:00Z', stepDays = 1 } = {}) {
  const startMs = Date.parse(start);
  return Array.from({ length: count }, (_, index) => questBundle(
    index + 1,
    new Date(startMs + index * stepDays * 86_400_000).toISOString()
  )).flat();
}

function candidateById(events, id) {
  return achievementEligibility(events).find((item) => item.achievement_id === id);
}

test('no achievement is inferred from legacy, reported, or unrewarded completion', () => {
  const events = [
    ...questBundle('legacy', '2026-09-01T08:00:00Z', { questVersion: 1 }),
    ...questBundle('reported', '2026-09-02T08:00:00Z', { completionClaim: 'reported' }),
    ...questBundle('unrewarded', '2026-09-03T08:00:00Z', { rewarded: false })
  ];
  assert.deepEqual(achievementEligibility(events), []);
  assert.equal(achievementSnapshot(events).verified_rewarded_quest_v2_completions, 0);
});

test('first verified rewarded Quest v2 completion yields one exact permission-gated candidate', () => {
  const events = bundles(1);
  const candidates = achievementEligibility(events);
  assert.equal(candidates.length, 1);
  const candidate = candidates[0];
  assert.equal(candidate.policy_ref, ACHIEVEMENT_POLICY_REF);
  assert.equal(candidate.achievement_id, 'system-achievement-first-verified-win-v1');
  assert.equal(candidate.threshold_count, 1);
  assert.equal(candidate.qualifying_count, 1);
  assert.equal(candidate.requires_exact_mutation_permission, true);
  assert.deepEqual(candidate.action, {
    type: 'achievement.unlock',
    payload: {
      achievement_id: 'system-achievement-first-verified-win-v1',
      title: 'Первый подтверждённый шаг',
      description: 'Первое подтверждённое и вознаграждённое задание Quest v2.',
      rank: 'E',
      evidence: {
        status: 'verified',
        source: 'system-ledger',
        ref: candidate.action.payload.evidence.ref
      }
    }
  });
  assert.match(candidate.action.payload.evidence.ref, /^system-achievement-ledger:v1;achievement=system-achievement-first-verified-win-v1;count=1;sha256=[0-9a-f]{64}$/);
});

test('five distinct verified rewarded completions make first and five-win milestones eligible', () => {
  const ids = achievementEligibility(bundles(5)).map((item) => item.achievement_id);
  assert.deepEqual(ids, [
    'system-achievement-first-verified-win-v1',
    'system-achievement-five-verified-wins-v1'
  ]);
});

test('20-completion consistency milestone requires an actual 28-day horizon', () => {
  const shortEvents = bundles(20, { stepDays: 1 });
  assert.equal(candidateById(shortEvents, 'system-achievement-consistency-20x28-v1'), undefined);

  const longEvents = bundles(20, { stepDays: 1.5 });
  const candidate = candidateById(longEvents, 'system-achievement-consistency-20x28-v1');
  assert.ok(candidate);
  assert.equal(candidate.threshold_count, 20);
  assert.equal(candidate.qualifying_count, 20);
  assert.ok(candidate.span_days >= 28);
});

test('later completion may satisfy the 28-day horizon without requiring a new threshold count', () => {
  const events = bundles(20, { stepDays: 1 });
  events.push(...questBundle(21, '2026-10-01T08:00:00Z'));
  const candidate = candidateById(events, 'system-achievement-consistency-20x28-v1');
  assert.ok(candidate);
  assert.equal(candidate.threshold_count, 20);
  assert.equal(candidate.qualifying_count, 21);
  assert.ok(candidate.span_days >= 28);
});

test('already unlocked achievement is suppressed while later milestones remain eligible', () => {
  const events = bundles(5);
  events.push({
    event_id: 'achievement-existing',
    event_type: 'achievement.unlocked',
    claim_status: 'verified',
    occurred_at: '2026-09-06T08:00:00Z',
    payload: { achievement_id: 'system-achievement-first-verified-win-v1' }
  });
  assert.deepEqual(achievementEligibility(events).map((item) => item.achievement_id), [
    'system-achievement-five-verified-wins-v1'
  ]);
});

test('input order cannot change eligibility or evidence digest', () => {
  const events = bundles(5);
  const forward = achievementEligibility(events);
  const reverse = achievementEligibility([...events].reverse());
  assert.deepEqual(reverse, forward);
});

test('invalid non-array input fails closed', () => {
  assert.deepEqual(achievementEligibility({}), []);
  assert.deepEqual(achievementSnapshot(null), {
    policy_ref: ACHIEVEMENT_POLICY_REF,
    verified_rewarded_quest_v2_completions: 0,
    first_completion_at: null,
    latest_completion_at: null,
    candidates: []
  });
});
