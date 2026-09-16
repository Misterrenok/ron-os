import test from 'node:test';
import assert from 'node:assert/strict';
import { wrapStore } from '../src/challenge-store.mjs';

function ephemeralBase() {
  return {
    pool: null,
    async init() {},
    async applyAction() { throw new Error('base action gate must not receive Challenge writes'); },
    async getByIdempotencyKey() { return null; },
    async listAllEvents() { return []; },
    async listEvents() { return []; },
    async close() {}
  };
}

test('Challenge writes fail closed when PostgreSQL atomic gate is unavailable', async () => {
  const store = wrapStore(ephemeralBase());
  await store.init();
  assert.equal(store.challengeWritesAtomic, false);

  await assert.rejects(
    store.applyAction({ type: 'challenge.create', payload: {} }, { actor: 'test', source: 'test', sourceRef: null }, 'challenge-gate-create'),
    /requires PostgreSQL atomic action gate/
  );

  await assert.rejects(
    store.expireChallenge({ quest_id: 'q1', contract_id: '33333333-3333-4333-8333-333333333333' }, { actor: 'test', source: 'test', sourceRef: null }, 'challenge-gate-expire'),
    /requires PostgreSQL atomic action gate/
  );
});
