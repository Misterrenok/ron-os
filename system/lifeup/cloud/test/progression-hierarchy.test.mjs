import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PROGRESSION_HIERARCHY_POLICY_REF,
  evaluateArcMilestoneEligibility,
  evaluateBossEligibility,
  progressionHierarchySnapshot,
  verifiedRewardedQuestOutcomes
} from '../src/progression-hierarchy.mjs';

function questBundle(id, occurredAt, {
  questVersion = 2,
  completionClaim = 'verified',
  rewarded = true,
  outcomeKey = `outcome:${id}`
} = {}) {
  const completionId = `completion-${id}`;
  const create = {
    event_id: `create-${id}`,
    event_type: 'quest.created',
    claim_status: 'derived',
    occurred_at: new Date(Date.parse(occurredAt) - 60_000).toISOString(),
    source_ref: 'system-quest-difficulty:v1',
    payload: {
      quest_id: `quest-${id}`,
      quest_version: questVersion,
      outcome_key: outcomeKey,
      rank: 'D',
      class: 'SIDE'
    }
  };
  const completion = {
    event_id: completionId,
    event_type: 'quest.completed',
    claim_status: completionClaim,
    occurred_at: new Date(occurredAt).toISOString(),
    payload: { quest_id: `quest-${id}`, evidence: { status: completionClaim } }
  };
  const award = {
    event_id: `award-${id}`,
    event_type: 'progression.awarded',
    claim_status: 'verified',
    occurred_at: new Date(Date.parse(occurredAt) + 1000).toISOString(),
    payload: { basis_event_id: completionId, xp: 10, coins: 0 }
  };
  return rewarded ? [create, completion, award] : [create, completion];
}

const verified = (ref, source = 'ron-os') => ({ status: 'verified', source, ref });

function twoQuestLedger() {
  return [
    ...questBundle('a', '2026-09-01T08:00:00Z'),
    ...questBundle('b', '2026-09-02T08:00:00Z')
  ];
}

test('verified rewarded Quest v2 outcomes are the only hierarchy basis and are order-invariant', () => {
  const events = [
    ...questBundle('valid', '2026-09-01T08:00:00Z'),
    ...questBundle('legacy', '2026-09-02T08:00:00Z', { questVersion: 1 }),
    ...questBundle('reported', '2026-09-03T08:00:00Z', { completionClaim: 'reported' }),
    ...questBundle('unrewarded', '2026-09-04T08:00:00Z', { rewarded: false })
  ];
  const forward = verifiedRewardedQuestOutcomes(events);
  const reverse = verifiedRewardedQuestOutcomes([...events].reverse());
  assert.equal(forward.length, 1);
  assert.equal(forward[0].quest_id, 'quest-valid');
  assert.deepEqual(reverse, forward);
});

test('Boss eligibility requires verified completion plus either multiple verified capabilities or a verified major-barrier baseline comparison', () => {
  const events = questBundle('boss', '2026-09-01T08:00:00Z');
  const multi = evaluateBossEligibility({
    events,
    quest_id: 'quest-boss',
    capabilities: [verified('skill:a'), verified('skill:b')]
  });
  assert.equal(multi.status, 'ELIGIBLE');
  assert.equal(multi.qualification_mode, 'MULTI_CAPABILITY');
  assert.equal(multi.action, null);
  assert.deepEqual(multi.reward_delta, { xp: 0, coins: 0 });
  assert.match(multi.evidence_ref, /^system-progression-hierarchy:v1;kind=boss;/);

  const barrier = evaluateBossEligibility({
    events,
    quest_id: 'quest-boss',
    major_barrier: verified('barrier:current'),
    baseline: verified('baseline:verified')
  });
  assert.equal(barrier.status, 'ELIGIBLE');
  assert.equal(barrier.qualification_mode, 'MAJOR_BARRIER');
});

test('Boss eligibility fails closed for delay, reported evidence, missing outcome identity, or duplicate outcome', () => {
  const events = questBundle('boss', '2026-09-01T08:00:00Z');
  const delayOnly = evaluateBossEligibility({ events, quest_id: 'quest-boss', capabilities: [] });
  assert.equal(delayOnly.status, 'UNVERIFIED');
  assert.ok(delayOnly.failed_requirements.includes('multi_capability_or_verified_major_barrier_vs_baseline'));

  const reported = evaluateBossEligibility({
    events,
    quest_id: 'quest-boss',
    capabilities: [
      { status: 'reported', source: 'ron', ref: 'skill:a' },
      verified('skill:b')
    ]
  });
  assert.equal(reported.status, 'UNVERIFIED');

  const noIdentity = evaluateBossEligibility({
    events: questBundle('legacy-keyless', '2026-09-01T08:00:00Z', { outcomeKey: null }),
    quest_id: 'quest-legacy-keyless',
    capabilities: [verified('skill:a'), verified('skill:b')]
  });
  assert.ok(noIdentity.failed_requirements.includes('stable_outcome_key'));

  const duplicate = evaluateBossEligibility({
    events,
    quest_id: 'quest-boss',
    capabilities: [verified('skill:a'), verified('skill:b')],
    existing_boss_outcome_keys: ['outcome:boss']
  });
  assert.ok(duplicate.failed_requirements.includes('no_duplicate_boss_outcome'));
});

test('Arc milestone requires a verified phase transition and multiple distinct verified rewarded Quest v2 outcomes', () => {
  const events = twoQuestLedger();
  const eligible = evaluateArcMilestoneEligibility({
    events,
    milestone_id: 'arc:german:a1-foundation',
    basis_quest_ids: ['quest-b', 'quest-a', 'quest-a'],
    phase_transition: verified('learning:german:a1:criteria-met')
  });
  assert.equal(eligible.status, 'ELIGIBLE');
  assert.deepEqual(eligible.basis_quest_ids, ['quest-a', 'quest-b']);
  assert.equal(eligible.action, null);
  assert.deepEqual(eligible.reward_delta, { xp: 0, coins: 0 });
  assert.match(eligible.evidence_ref, /^system-progression-hierarchy:v1;kind=arc;/);

  const oneQuest = evaluateArcMilestoneEligibility({
    events,
    milestone_id: 'arc:too-small',
    basis_quest_ids: ['quest-a'],
    phase_transition: verified('phase:one')
  });
  assert.equal(oneQuest.status, 'UNVERIFIED');
  assert.ok(oneQuest.failed_requirements.includes('multiple_verified_underlying_outcomes'));
});

test('Arc eligibility fails closed when any basis is unverified or milestone is already classified', () => {
  const events = questBundle('a', '2026-09-01T08:00:00Z');
  const missingBasis = evaluateArcMilestoneEligibility({
    events,
    milestone_id: 'arc:missing',
    basis_quest_ids: ['quest-a', 'quest-b'],
    phase_transition: verified('phase:missing')
  });
  assert.ok(missingBasis.failed_requirements.includes('all_basis_quests_verified_rewarded_quest_v2'));

  const duplicate = evaluateArcMilestoneEligibility({
    events: twoQuestLedger(),
    milestone_id: 'arc:existing',
    basis_quest_ids: ['quest-a', 'quest-b'],
    phase_transition: verified('phase:existing'),
    existing_arc_ids: ['arc:existing']
  });
  assert.ok(duplicate.failed_requirements.includes('no_duplicate_arc_milestone'));
});

test('snapshot is read-only and explicitly refuses to infer Rank evolution before a later policy', () => {
  const events = twoQuestLedger();
  const snapshot = progressionHierarchySnapshot({
    events,
    boss_candidates: [{
      quest_id: 'quest-a',
      capabilities: [verified('skill:a'), verified('skill:b')]
    }],
    arc_candidates: [{
      milestone_id: 'arc:sample',
      basis_quest_ids: ['quest-a', 'quest-b'],
      phase_transition: verified('phase:sample')
    }]
  });
  assert.equal(snapshot.policy_ref, PROGRESSION_HIERARCHY_POLICY_REF);
  assert.equal(snapshot.read_only, true);
  assert.equal(snapshot.boss_candidates[0].status, 'ELIGIBLE');
  assert.equal(snapshot.arc_candidates[0].status, 'ELIGIBLE');
  assert.deepEqual(snapshot.rank_evolution, {
    status: 'NOT_EVALUATED',
    reason: 'writable_rank_policy_not_promoted',
    action: null
  });
});

test('invalid inputs fail closed without throwing', () => {
  assert.deepEqual(verifiedRewardedQuestOutcomes({}), []);
  const boss = evaluateBossEligibility({});
  assert.equal(boss.status, 'UNVERIFIED');
  assert.ok(boss.failed_requirements.includes('quest_id'));
  const arc = evaluateArcMilestoneEligibility({});
  assert.equal(arc.status, 'UNVERIFIED');
  assert.ok(arc.failed_requirements.includes('milestone_id'));
});
