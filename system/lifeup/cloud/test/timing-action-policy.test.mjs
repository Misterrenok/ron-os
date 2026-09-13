import test from 'node:test';
import assert from 'node:assert/strict';
import { validateTimingAction } from '../src/timing-action-policy.mjs';

const create = (payload) => ({ type: 'quest.create', payload: { quest_version: 2, title: 'Quest', objectives: [], ...payload } });

test('deadline-free Quest v2 defaults to NONE timing', () => {
  assert.deepEqual(validateTimingAction(create({ deadline_at: null })), { timing_mode: 'NONE' });
});

test('new deadline-bearing Quest v2 fails closed without explicit timing semantics', () => {
  assert.throws(
    () => validateTimingAction(create({ deadline_at: '2026-09-20T12:00:00Z' })),
    /timing_mode is required/
  );
});

test('HARD_EXTERNAL is accepted for an explicit real deadline', () => {
  assert.deepEqual(validateTimingAction(create({
    deadline_at: '2026-09-20T12:00:00Z',
    timing_mode: 'HARD_EXTERNAL'
  })), { timing_mode: 'HARD_EXTERNAL' });
});

test('artificial NONE deadline and challenge contract misuse fail closed', () => {
  assert.throws(
    () => validateTimingAction(create({ deadline_at: '2026-09-20T12:00:00Z', timing_mode: 'NONE' })),
    /HARD_EXTERNAL or CHALLENGE/
  );
  assert.throws(
    () => validateTimingAction(create({ deadline_at: null, timing_mode: 'HARD_EXTERNAL' })),
    /requires payload.deadline_at/
  );
  assert.throws(
    () => validateTimingAction(create({ challenge_contract: { contract_id: 'x' } })),
    /challenge_contract is allowed only after CHALLENGE runtime activation/
  );
});

test('CHALLENGE fails closed until its persistence and recovery runtime is promoted', () => {
  assert.throws(
    () => validateTimingAction(create({
      deadline_at: '2026-09-20T12:00:00Z',
      timing_mode: 'CHALLENGE',
      challenge_contract: {
        contract_id: 'c1',
        recovery_title: 'Recovery',
        recovery_objective: 'Return to task'
      }
    })),
    /CHALLENGE timing is not activated/
  );
});
