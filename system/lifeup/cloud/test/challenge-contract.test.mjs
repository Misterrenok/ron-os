import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import {
  CHALLENGE_POLICY_REF,
  challengeDeclarationAction,
  challengeRecoveryQuestAction,
  challengeQuestAction,
  normalizeChallengeCreate,
  recoveryObjectiveId,
  recoveryQuestId
} from '../src/challenge-contract.mjs';
import { actionToEvent, buildSnapshot, validateEventAgainstHistory } from '../src/quest-v2.mjs';

const context = { actor: 'test', source: 'challenge-test', sourceRef: CHALLENGE_POLICY_REF };

function challengeAction(overrides = {}) {
  const contractId = overrides.contractId ?? randomUUID();
  return {
    type: 'challenge.create',
    payload: {
      quest: {
        quest_id: overrides.questId ?? 'challenge-q',
        quest_version: 2,
        title: 'Сложный, но посильный шаг',
        description: 'Проверяем Challenge Contract v1.',
        class: 'SIDE',
        rank: 'D',
        reward_xp: 10,
        reward_coins: 0,
        objectives: [{ objective_id: 'do-step', title: 'Сделать шаг', target: 1, unit: 'check', required: true }],
        deadline_at: overrides.deadline ?? '2026-09-17T18:00:00+03:00',
        visibility: overrides.visibility ?? 'VISIBLE'
      },
      contract: {
        contract_id: contractId,
        recovery_title: overrides.recoveryTitle ?? 'Вернуться одним коротким шагом',
        recovery_objective: overrides.recoveryObjective ?? 'Сделать восстановительный шаг',
        recovery_target: overrides.recoveryTarget ?? 1,
        recovery_unit: overrides.recoveryUnit ?? 'check'
      }
    }
  };
}

test('normalizes an exact visible future Challenge contract with deterministic recovery ids', () => {
  const contractId = randomUUID();
  const normalized = normalizeChallengeCreate(challengeAction({ contractId }), { now: Date.parse('2026-09-16T18:00:00+03:00') });
  assert.equal(normalized.contract.contract_id, contractId);
  assert.equal(normalized.contract.recovery_quest_id, recoveryQuestId(contractId));
  assert.equal(normalized.contract.recovery_objective_id, recoveryObjectiveId(contractId));
  assert.equal(normalized.quest.deadline_at, '2026-09-17T15:00:00.000Z');
  assert.equal(normalized.quest.visibility, 'VISIBLE');
});

test('fails closed for past deadline, hidden Challenge or incomplete recovery contract', () => {
  assert.throws(
    () => normalizeChallengeCreate(challengeAction({ deadline: '2026-09-15T18:00:00+03:00' }), { now: Date.parse('2026-09-16T18:00:00+03:00') }),
    /future/
  );
  assert.throws(
    () => normalizeChallengeCreate(challengeAction({ visibility: 'HIDDEN' }), { now: Date.parse('2026-09-16T18:00:00+03:00') }),
    /player-visible/
  );
  assert.throws(
    () => normalizeChallengeCreate(challengeAction({ recoveryTitle: '' }), { now: Date.parse('2026-09-16T18:00:00+03:00') }),
    /recovery_title/
  );
});

test('Challenge declaration plus Quest v2 projects timing mode and exact recovery contract', () => {
  const normalized = normalizeChallengeCreate(challengeAction(), { now: Date.parse('2026-09-16T18:00:00+03:00') });
  const declared = Object.assign(actionToEvent(challengeDeclarationAction(normalized), context), { seq: 1, occurred_at: '2026-09-16T15:00:00.000Z' });
  validateEventAgainstHistory(declared, []);
  const created = Object.assign(actionToEvent(challengeQuestAction(normalized), context), { seq: 2, occurred_at: '2026-09-16T15:00:00.001Z' });
  validateEventAgainstHistory(created, [declared]);
  const snapshot = buildSnapshot([declared, created]);
  assert.equal(snapshot.quests[0].timing_mode, 'CHALLENGE');
  assert.equal(snapshot.quests[0].challenge_contract.contract_id, normalized.contract.contract_id);
  assert.equal(snapshot.quests[0].challenge_contract.recovery_title, normalized.contract.recovery_title);
});

test('Challenge v1 refuses retrofit declaration after the Quest already exists', () => {
  const normalized = normalizeChallengeCreate(challengeAction(), { now: Date.parse('2026-09-16T18:00:00+03:00') });
  const created = Object.assign(actionToEvent(challengeQuestAction(normalized), context), { seq: 1, occurred_at: '2026-09-16T15:00:00.000Z' });
  const declared = Object.assign(actionToEvent(challengeDeclarationAction(normalized), context), { seq: 2, occurred_at: '2026-09-16T15:00:00.001Z' });
  assert.throws(() => validateEventAgainstHistory(declared, [created]), /cannot retrofit/);
});

test('predeclared recovery quest is visible RECOVERY and unscored by default', () => {
  const normalized = normalizeChallengeCreate(challengeAction(), { now: Date.parse('2026-09-16T18:00:00+03:00') });
  const action = challengeRecoveryQuestAction(normalized.contract, normalized.quest);
  assert.equal(action.type, 'quest.create');
  assert.equal(action.payload.class, 'RECOVERY');
  assert.equal(action.payload.visibility, 'VISIBLE');
  assert.equal(action.payload.reward_xp, null);
  assert.equal(action.payload.reward_coins, null);
  assert.equal(action.payload.deadline_at, null);
  assert.equal(action.payload.quest_id, normalized.contract.recovery_quest_id);
});
