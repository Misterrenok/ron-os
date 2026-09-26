import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GROWTH_POLICY_REF,
  SKILL_MASTERY_POLICY_REF,
  buildGrowthProjection,
  normalizeGrowthMapping,
  planGrowthActions,
  secondaryMasteryXp,
  skillMasterySnapshot
} from '../src/growth-engine.mjs';
import { evaluateSkillProposal } from '../src/skill-evidence.mjs';

function baseEvents({ secondary = false } = {}) {
  const growth = {
    policy_ref: GROWTH_POLICY_REF,
    primary_skill: {
      skill_id: 'german-language',
      name: 'German Language',
      domain: 'language',
      evidence_kind: 'guided_practice'
    },
    secondary_skills: secondary ? [{
      skill_id: 'learning-practice',
      name: 'Learning Practice',
      domain: 'learning',
      evidence_kind: 'guided_practice'
    }] : [],
    attributes: [{ name: 'INT', kind: 'baseline' }]
  };
  return [
    {
      seq: 1, event_id: 'create-1', event_type: 'quest.created', occurred_at: '2026-09-26T14:10:00.000Z',
      actor: 'chatgpt', source: 'test', source_ref: 'system-quest-difficulty:v1', claim_status: 'derived',
      payload: { quest_id: 'q1', quest_version: 2, title: 'German lesson', class: 'MAIN', rank: 'D', reward_xp: 10, reward_coins: 0, objectives: [], deadline_at: null, visibility: 'VISIBLE' }
    },
    {
      seq: 2, event_id: 'growth-1', event_type: 'quest.growth.assigned', occurred_at: '2026-09-26T14:11:00.000Z',
      actor: 'chatgpt', source: 'system-controller', source_ref: GROWTH_POLICY_REF, claim_status: 'derived',
      payload: { quest_id: 'q1', policy_ref: GROWTH_POLICY_REF, growth }
    },
    {
      seq: 3, event_id: 'complete-1', event_type: 'quest.completed', occurred_at: '2026-09-26T14:20:00.000Z',
      actor: 'chatgpt', source: 'test', source_ref: 'test:verified', claim_status: 'verified',
      payload: { quest_id: 'q1', evidence: { status: 'verified', source: 'test', ref: 'done:q1' } }
    },
    {
      seq: 4, event_id: 'award-1', event_type: 'progression.awarded', occurred_at: '2026-09-26T14:20:01.000Z',
      actor: 'chatgpt', source: 'test', source_ref: 'test:verified', claim_status: 'verified',
      payload: { basis_event_id: 'complete-1', xp: 10, coins: 0, reward_policy_ref: 'system-quest-reward:v1' }
    }
  ];
}

test('growth mapping is explicit, bounded and rejects fake skill fragmentation', () => {
  const normalized = normalizeGrowthMapping({
    primary_skill: { skill_id: 'german-language', name: 'German Language', domain: 'language' },
    attributes: [{ name: 'INT', kind: 'baseline' }]
  });
  assert.equal(normalized.policy_ref, GROWTH_POLICY_REF);
  assert.equal(normalized.primary_skill.evidence_kind, 'guided_practice');
  assert.throws(() => normalizeGrowthMapping({
    primary_skill: { skill_id: 'Bebris Lesson 3', name: 'Lesson', domain: 'learning' }
  }), /normalized lowercase id/);
  assert.throws(() => normalizeGrowthMapping({
    primary_skill: { skill_id: 'german-language', name: 'German', domain: 'language' },
    secondary_skills: [{ skill_id: 'german-language', name: 'German duplicate', domain: 'language' }]
  }), /unique/);
});

test('skill Mastery is a separate nonlinear game curve', () => {
  assert.deepEqual(skillMasterySnapshot(0), {
    level: 1, xp: 0, xp_into_level: 0, xp_to_next: 50, level_span_xp: 50,
    current_level_floor_xp: 0, next_level_threshold_xp: 50, policy_ref: SKILL_MASTERY_POLICY_REF
  });
  assert.equal(skillMasterySnapshot(49).level, 1);
  assert.equal(skillMasterySnapshot(50).level, 2);
  assert.equal(skillMasterySnapshot(50).xp_to_next, 60);
  assert.equal(skillMasterySnapshot(110).level, 3);
  assert.equal(secondaryMasteryXp(5), 0);
  assert.equal(secondaryMasteryXp(10), 5);
  assert.equal(secondaryMasteryXp(20), 10);
});

test('verified mapped completion gives Mastery and evidence without changing global XP', () => {
  const events = baseEvents({ secondary: true });
  const growth = buildGrowthProjection(events, { now: Date.parse('2026-09-26T14:21:00.000Z') });
  const german = growth.skills.find((skill) => skill.id === 'german-language');
  const secondary = growth.skills.find((skill) => skill.id === 'learning-practice');
  assert.equal(german.mastery_xp, 10);
  assert.equal(german.mastery_level, 1);
  assert.equal(german.mastery_xp_to_next, 40);
  assert.equal(german.highest_eligible_level, 1);
  assert.equal(secondary.mastery_xp, 5);
  assert.equal(growth.attributes.INT.evidence_count, 1);
  assert.equal(growth.attributes.INT.highest_eligible_value, 1);
  assert.equal(growth.last_gain.global_xp, 10);
});

test('growth planner promotes only evidence-supported real tiers', () => {
  const events = baseEvents();
  const plans = planGrowthActions(events, { now: Date.parse('2026-09-26T14:21:00.000Z') });
  const skill = plans.find((plan) => plan.kind === 'SKILL');
  const attribute = plans.find((plan) => plan.kind === 'ATTRIBUTE');
  assert.equal(skill.target_id, 'german-language');
  assert.equal(skill.target_value, 1);
  assert.equal(skill.action.payload.scale_ref, 'system-skill-competency5:v1');
  assert.match(skill.action.payload.evidence.ref, /basis=complete-1/);
  assert.equal(attribute.target_id, 'INT');
  assert.equal(attribute.target_value, 1);
  assert.equal(attribute.action.payload.scale_ref, 'system-attribute-ordinal5:v1');
  assert.match(attribute.action.payload.evidence.ref, /basis=complete-1/);
});

test('global level or unmapped reward alone cannot invent growth', () => {
  const events = baseEvents().filter((event) => event.event_type !== 'quest.growth.assigned');
  const growth = buildGrowthProjection(events, { now: Date.parse('2026-09-26T14:21:00.000Z') });
  assert.equal(growth.skills.length, 0);
  assert.equal(growth.attributes.INT.evidence_count, 0);
  assert.deepEqual(planGrowthActions(events, { now: Date.parse('2026-09-26T14:21:00.000Z') }), []);
});

test('skill evidence does not allow volume-only fast Tier 2', () => {
  const one = {
    status: 'verified', source: 'test', ref: 'one', observed_at: '2026-09-26T14:20:00.000Z',
    kind: 'guided_practice', skill_id: 'german-language'
  };
  const tier1 = evaluateSkillProposal({ skill_id: 'german-language', value: 1, evidence: [one], as_of: '2026-09-26T14:21:00.000Z' });
  const tier2 = evaluateSkillProposal({ skill_id: 'german-language', value: 2, evidence: [one], as_of: '2026-09-26T14:21:00.000Z' });
  assert.equal(tier1.status, 'ELIGIBLE');
  assert.equal(tier2.status, 'UNRESOLVED');
  assert.ok(tier2.failed_requirements.includes('verified_evidence_count>=4'));
});
