import test from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../src/resolution-store.mjs';

const databaseUrl = process.env.TEST_DATABASE_URL?.trim();
const context = {
  actor: 'chatgpt',
  source: 'followthrough-postgres-test',
  sourceRef: 'system-evidence-followthrough:v1'
};

test('PostgreSQL gate allows exactly one same-value REPORTED to VERIFIED objective upgrade', { skip: !databaseUrl }, async () => {
  const previousDatabaseUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = databaseUrl;
  const store = await createStore();

  try {
    await store.init();

    await store.applyAction({
      type: 'quest.create',
      payload: {
        quest_id: 'followthrough-pg-q',
        quest_version: 2,
        title: 'Evidence follow-through PostgreSQL probe',
        class: 'SIDE',
        rank: 'E',
        objectives: [
          { objective_id: 'proof', title: 'Provide proof', target: 1, unit: 'proof', required: true }
        ]
      }
    }, context, 'followthrough-pg-create');

    const reported = await store.applyAction({
      type: 'quest.progress',
      payload: {
        quest_id: 'followthrough-pg-q',
        objective_id: 'proof',
        value: 1,
        evidence: { status: 'reported', source: 'ron', ref: 'direct-report' }
      }
    }, context, 'followthrough-pg-reported');
    assert.equal(reported.event.claim_status, 'reported');

    const verified = await store.applyAction({
      type: 'quest.progress',
      payload: {
        quest_id: 'followthrough-pg-q',
        objective_id: 'proof',
        value: 1,
        evidence: { status: 'verified', source: 'controller', ref: 'checked-proof' }
      }
    }, context, 'followthrough-pg-verified');
    assert.equal(verified.event.claim_status, 'verified');

    await assert.rejects(
      store.applyAction({
        type: 'quest.progress',
        payload: {
          quest_id: 'followthrough-pg-q',
          objective_id: 'proof',
          value: 1,
          evidence: { status: 'verified', source: 'controller', ref: 'duplicate-proof' }
        }
      }, context, 'followthrough-pg-verified-duplicate'),
      /progress must strictly increase unless verifying reported progress/
    );
  } finally {
    await store.close();
    if (previousDatabaseUrl == null) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousDatabaseUrl;
  }
});
