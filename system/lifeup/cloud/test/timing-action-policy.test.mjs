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

test('artificial NONE deadline and direct challenge contract misuse fail closed', () => {
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
    /not a direct quest\.create field; use challenge\.create/
  );
});

test('timing fields cannot be smuggled through legacy quest.create', () => {
  assert.throws(
    () => validateTimingAction({ type: 'quest.create', payload: { title: 'Legacy', timing_mode: 'CHALLENGE' } }),
    /timing fields require a Quest v2 create/
  );
  assert.throws(
    () => validateTimingAction({ type: 'quest.create', payload: { title: 'Legacy', challenge_contract: { contract_id: 'x' } } }),
    /timing fields require a Quest v2 create/
  );
});

test('direct quest.create CHALLENGE remains closed because challenge.create owns atomic persistence', () => {
  assert.throws(
    () => validateTimingAction(create({
      deadline_at: '2026-09-20T12:00:00Z',
      timing_mode: 'CHALLENGE'
    })),
    /Use challenge\.create so the Challenge contract and Quest persist atomically/
  );
});
