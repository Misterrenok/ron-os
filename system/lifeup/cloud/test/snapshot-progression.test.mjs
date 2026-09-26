import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPlayerSnapshot } from '../src/snapshot-projection.mjs';

function verifiedQuestBundle(id = 'a') {
  const questId = `quest-${id}`;
  const completionId = `completion-${id}`;
  return [
    {
      event_id: `create-${id}`,
      event_type: 'quest.created',
      occurred_at: '2026-09-01T08:00:00Z',
      actor: 'chatgpt',
      source: 'test',
      source_ref: 'system-quest-difficulty:v1',
      claim_status: 'derived',
      payload: {
        quest_id: questId,
        title: 'Verified outcome',
        description: 'Test outcome',
        class: 'SIDE',
        rank: 'D',
        reward_xp: 10,
        reward_coins: 0,
        reward_policy_ref: 'system-quest-reward:v1',
        quest_version: 2,
        outcome_key: `outcome:${id}`,
        objectives: [],
        deadline_at: null,
        visibility: 'VISIBLE'
      }
    },
    {
      event_id: completionId,
      event_type: 'quest.completed',
      occurred_at: '2026-09-01T09:00:00Z',
      actor: 'chatgpt',
      source: 'test',
      source_ref: 'test:verified',
      claim_status: 'verified',
      payload: { quest_id: questId, evidence: { status: 'verified', source: 'test', ref: 'done:a' } }
    },
    {
      event_id: `award-${id}`,
      event_type: 'progression.awarded',
      occurred_at: '2026-09-01T09:00:01Z',
      actor: 'chatgpt',
      source: 'test',
      source_ref: 'test:verified',
      claim_status: 'verified',
      payload: { basis_event_id: completionId, xp: 10, coins: 0, reward_policy_ref: 'system-quest-reward:v1' }
    }
  ];
}

test('player snapshot always carries an honest read-only progression projection', () => {
  const snapshot = buildPlayerSnapshot([]);
  assert.equal(snapshot.progression.read_only, true);
  assert.equal(snapshot.progression.verified_quest_count, 0);
  assert.equal(snapshot.progression.boss.status, 'NO_CANDIDATE');
  assert.equal(snapshot.progression.arc.status, 'NO_CANDIDATE');
  assert.equal(snapshot.progression.rank.status, 'LOCKED');
  assert.deepEqual(snapshot.progression.reward_delta, { xp: 0, coins: 0 });
  assert.equal(snapshot.progression.action, null);
  assert.equal(snapshot.streak.policy_ref, 'system-execution-streak:v1');
  assert.equal(snapshot.streak.current, 0);
});

test('verified rewarded Quest v2 becomes visible growth without inventing Boss, Arc or Rank', () => {
  const snapshot = buildPlayerSnapshot(verifiedQuestBundle());
  assert.equal(snapshot.progression.verified_quest_count, 1);
  assert.equal(snapshot.progression.visible_growth, 'Подтверждённых результатов Quest v2: 1');
  assert.equal(snapshot.progression.boss.status, 'NO_CANDIDATE');
  assert.equal(snapshot.progression.arc.status, 'NO_CANDIDATE');
  assert.equal(snapshot.progression.rank.status, 'LOCKED');
  assert.deepEqual(snapshot.progression.reward_delta, { xp: 0, coins: 0 });
  assert.equal(snapshot.progression.action, null);
});

test('malformed snapshot input fails closed to an empty read-only progression view', () => {
  const snapshot = buildPlayerSnapshot({ not: 'a ledger' });
  assert.equal(snapshot.progression.read_only, true);
  assert.equal(snapshot.progression.verified_quest_count, 0);
  assert.equal(snapshot.progression.boss.status, 'NO_CANDIDATE');
  assert.equal(snapshot.progression.arc.status, 'NO_CANDIDATE');
  assert.equal(snapshot.progression.rank.status, 'LOCKED');
  assert.deepEqual(snapshot.progression.reward_delta, { xp: 0, coins: 0 });
  assert.equal(snapshot.progression.action, null);
});


test('player snapshot projects Quest-linked skill Mastery separately from competency', () => {
  const [created, completed, awarded] = verifiedQuestBundle('growth');
  created.seq = 1;
  completed.seq = 3;
  awarded.seq = 4;
  completed.occurred_at = '2026-09-26T14:20:00Z';
  awarded.occurred_at = '2026-09-26T14:20:01Z';
  const assignment = {
    seq: 2,
    event_id: 'growth-map',
    event_type: 'quest.growth.assigned',
    occurred_at: '2026-09-26T14:10:00Z',
    actor: 'chatgpt',
    source: 'system-controller',
    source_ref: 'system-growth:v1',
    claim_status: 'derived',
    payload: {
      quest_id: 'quest-growth',
      policy_ref: 'system-growth:v1',
      growth: {
        policy_ref: 'system-growth:v1',
        primary_skill: {
          skill_id: 'german-language',
          name: 'German Language',
          domain: 'language',
          evidence_kind: 'guided_practice'
        },
        secondary_skills: [],
        attributes: [{ name: 'INT', kind: 'baseline' }]
      }
    }
  };
  const snapshot = buildPlayerSnapshot([created, assignment, completed, awarded]);
  const german = snapshot.skills.find((skill) => skill.id === 'german-language');
  assert.equal(snapshot.growth.policy_ref, 'system-growth:v1');
  assert.equal(german.mastery_xp, 10);
  assert.equal(german.mastery_level, 1);
  assert.equal(german.level, null);
  assert.equal(german.highest_eligible_level, 1);
  assert.equal(snapshot.growth.attributes.INT.evidence_count, 1);
  assert.equal(snapshot.growth.attributes.INT.highest_eligible_value, 1);
});
