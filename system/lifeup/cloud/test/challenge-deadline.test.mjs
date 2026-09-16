import test from 'node:test';
import assert from 'node:assert/strict';
import { runDeadlineSweep } from '../src/deadline-engine.mjs';
import { actionToEvent } from '../src/quest-v2.mjs';
import { challengeDeclarationAction } from '../src/challenge-contract.mjs';

const contractId = '22222222-2222-4222-8222-222222222222';
const deadline = '2026-09-16T12:00:00.000Z';
const context = { actor: 'test', source: 'challenge-deadline-test', sourceRef: 'ci' };

function seedEvents() {
  const normalized = {
    quest: {
      quest_id: 'challenge-deadline-q',
      quest_version: 2,
      title: 'Испытание на срок',
      description: '',
      class: 'SIDE',
      rank: 'D',
      reward_xp: 10,
      reward_coins: 0,
      objectives: [],
      deadline_at: deadline,
      visibility: 'VISIBLE'
    },
    contract: {
      contract_id: contractId,
      recovery_quest_id: `challenge-recovery:${contractId}`,
      recovery_objective_id: `challenge-recovery-objective:${contractId}`,
      recovery_title: 'Вернуться коротким шагом',
      recovery_objective: 'Сделать восстановительный шаг',
      recovery_target: 1,
      recovery_unit: 'check'
    }
  };
  const declared = actionToEvent(challengeDeclarationAction(normalized), context);
  Object.assign(declared, { seq: 1, occurred_at: '2026-09-15T12:00:00.000Z' });
  const created = actionToEvent({ type: 'quest.create', payload: normalized.quest }, context);
  Object.assign(created, { seq: 2, occurred_at: '2026-09-15T12:00:00.001Z' });
  return [declared, created];
}

test('missed Challenge routes through atomic expireChallenge and then emits one recovery notice', async () => {
  const events = seedEvents();
  const expireCalls = [];
  const genericActions = [];
  const notifications = [];
  const store = {
    async listAllEvents() { return structuredClone(events); },
    async expireChallenge(input, ctx, key) {
      expireCalls.push({ input, ctx, key });
      return {
        replay: false,
        event: { event_type: 'quest.expired', payload: { quest_id: input.quest_id } },
        recovery_quest_id: `challenge-recovery:${input.contract_id}`
      };
    },
    async applyAction(action, ctx, key) {
      genericActions.push({ action, ctx, key });
      const event = actionToEvent(action, ctx);
      notifications.push(event);
      return { replay: false, event };
    }
  };

  const result = await runDeadlineSweep({
    store,
    now: Date.parse('2026-09-16T12:00:01.000Z'),
    onNotification: () => {}
  });

  assert.equal(expireCalls.length, 1);
  assert.deepEqual(expireCalls[0].input, { quest_id: 'challenge-deadline-q', contract_id: contractId });
  assert.equal(genericActions.some((item) => item.action.type === 'quest.expire'), false);
  assert.equal(genericActions.filter((item) => item.action.type === 'notification.push').length, 1);
  assert.match(genericActions[0].action.payload.title, /^Испытание завершено:/);
  assert.match(genericActions[0].action.payload.body, /Вернуться коротким шагом/);
  assert.deepEqual(result.map((item) => item.kind), ['challenge-expiry', 'expired-notification']);
  assert.equal(result[0].recovery_quest_id, `challenge-recovery:${contractId}`);
});

test('Challenge reminder explains preaccepted recovery instead of pretending a hard external deadline', async () => {
  const events = seedEvents();
  const actions = [];
  const store = {
    async listAllEvents() { return structuredClone(events); },
    async expireChallenge() { throw new Error('must not expire before deadline'); },
    async applyAction(action, ctx, key) {
      actions.push({ action, ctx, key });
      return { replay: false, event: actionToEvent(action, ctx) };
    }
  };

  const result = await runDeadlineSweep({
    store,
    now: Date.parse('2026-09-16T11:50:00.000Z'),
    onNotification: () => {}
  });

  assert.deepEqual(result.map((item) => item.kind), ['reminder']);
  assert.match(actions[0].action.payload.title, /^Испытание:/);
  assert.match(actions[0].action.payload.body, /заранее согласованное восстановление/);
});
