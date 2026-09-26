import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createStore } from '../src/streak-excuse-store.mjs';

const databaseUrl = process.env.TEST_DATABASE_URL?.trim();
const context = { actor: 'chatgpt', source: 'growth-postgres-test', sourceRef: 'system-growth:v1' };

async function postgresStore() {
  const oldDb = process.env.DATABASE_URL;
  const oldSsl = process.env.PGSSL;
  process.env.DATABASE_URL = databaseUrl;
  process.env.PGSSL = 'disable';
  try {
    const store = await createStore();
    await store.init();
    return store;
  } finally {
    if (oldDb == null) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = oldDb;
    if (oldSsl == null) delete process.env.PGSSL; else process.env.PGSSL = oldSsl;
  }
}

function mapping() {
  return {
    primary_skill: {
      skill_id: 'german-language',
      name: 'German Language',
      domain: 'language',
      evidence_kind: 'guided_practice'
    },
    secondary_skills: [],
    attributes: [{ name: 'INT', kind: 'baseline' }]
  };
}

test('PostgreSQL Growth v1 assigns exactly one mapping to an active Quest v2', { skip: !databaseUrl }, async () => {
  const store = await postgresStore();
  const suffix = randomUUID().slice(0, 8);
  const questId = `growth-pg-${suffix}`;
  try {
    await store.applyAction({
      type: 'quest.create',
      payload: {
        quest_id: questId,
        quest_version: 2,
        title: 'Growth assignment probe',
        class: 'SIDE',
        rank: 'E',
        reward_xp: null,
        reward_coins: null,
        objectives: [],
        deadline_at: null,
        visibility: 'VISIBLE'
      }
    }, context, `growth-create-${suffix}`);

    const action = { type: 'quest.growth.assign', payload: { quest_id: questId, growth: mapping() } };
    const first = await store.applyAction(action, context, `growth-assign-${suffix}`);
    assert.equal(first.replay, false);
    assert.equal(first.event.event_type, 'quest.growth.assigned');
    assert.equal(first.event.payload.policy_ref, 'system-growth:v1');
    assert.equal(first.event.payload.growth.primary_skill.skill_id, 'german-language');

    const replay = await store.applyAction(action, context, `growth-assign-${suffix}`);
    assert.equal(replay.replay, true);

    await assert.rejects(
      store.applyAction(action, context, `growth-assign-duplicate-${suffix}`),
      /already has a growth mapping/
    );

    await store.applyAction(
      { type: 'quest.cancel', payload: { quest_id: questId, reason: 'test cleanup' } },
      context,
      `growth-cancel-${suffix}`
    );
  } finally {
    await store.close();
  }
});

test('PostgreSQL Growth v1 rejects terminal retrofit and malformed skill identity', { skip: !databaseUrl }, async () => {
  const store = await postgresStore();
  const suffix = randomUUID().slice(0, 8);
  const terminalId = `growth-terminal-${suffix}`;
  const malformedId = `growth-malformed-${suffix}`;
  try {
    for (const questId of [terminalId, malformedId]) {
      await store.applyAction({
        type: 'quest.create',
        payload: {
          quest_id: questId, quest_version: 2, title: 'Growth probe', class: 'SIDE', rank: 'E',
          reward_xp: null, reward_coins: null, objectives: [], deadline_at: null, visibility: 'VISIBLE'
        }
      }, context, `growth-create-${questId}`);
    }

    await store.applyAction(
      { type: 'quest.cancel', payload: { quest_id: terminalId, reason: 'terminal probe' } },
      context,
      `growth-cancel-${terminalId}`
    );
    await assert.rejects(
      store.applyAction(
        { type: 'quest.growth.assign', payload: { quest_id: terminalId, growth: mapping() } },
        context,
        `growth-after-terminal-${suffix}`
      ),
      /quest is not active/
    );

    const bad = mapping();
    bad.primary_skill.skill_id = 'Bebris Lesson 3';
    await assert.rejects(
      store.applyAction(
        { type: 'quest.growth.assign', payload: { quest_id: malformedId, growth: bad } },
        context,
        `growth-bad-id-${suffix}`
      ),
      /normalized lowercase id/
    );

    await store.applyAction(
      { type: 'quest.cancel', payload: { quest_id: malformedId, reason: 'test cleanup' } },
      context,
      `growth-cancel-${malformedId}`
    );
  } finally {
    await store.close();
  }
});
