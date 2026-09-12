import test from 'node:test';
import assert from 'node:assert/strict';
import { buildXmindStrategySourceRef, parseXmindStrategySourceRef } from '../src/strategy-bridge.mjs';

const now = new Date('2026-09-12T08:00:00Z');
const valid = {
  file_id: 'SzWCLc5N', sheet_id: '3d11f509-ea82-4b07-80ca-272b081bd57c',
  topic_id: '620849ac-93f0-4fc1-947a-16910068fd51', topic_label: 'Немецкий A1 → B1',
  status: 'VERIFIED', conflict_status: 'CLEAR', owner_refs: ['domains/learning.md'],
  checked_at: '2026-09-12T07:55:00Z'
};

test('verified read-only context round trips with difficulty provenance', () => {
  const parsed = parseXmindStrategySourceRef(buildXmindStrategySourceRef(valid, { now }));
  assert.equal(parsed.status, 'VERIFIED');
  assert.deepEqual(parsed.owner_refs, ['domains/learning.md']);
  assert.deepEqual(parsed.policy_refs, ['system-quest-difficulty:v1']);
});

test('verified context fails closed without owner, with conflict, stale check or write intent', () => {
  assert.throws(() => buildXmindStrategySourceRef({ ...valid, owner_refs: [] }, { now }), /failed validation/);
  assert.throws(() => buildXmindStrategySourceRef({ ...valid, conflict_status: 'CONFLICT' }, { now }), /failed validation/);
  assert.throws(() => buildXmindStrategySourceRef({ ...valid, checked_at: '2026-09-10T00:00:00Z' }, { now }), /stale/);
  assert.throws(() => buildXmindStrategySourceRef({ ...valid, mode: 'WRITE' }, { now }), /read-only/);
});

test('ordinary provenance and malformed bridge values remain unlinked', () => {
  assert.equal(parseXmindStrategySourceRef('system-quest-difficulty:v1'), null);
  assert.equal(parseXmindStrategySourceRef('system-xmind-strategy:v1?file=javascript:alert(1)'), null);
});


import { actionToEvent, buildSnapshot } from '../src/quest-v2.mjs';

test('Quest v2 snapshot exposes strategy context while ordinary quests remain compatible', () => {
  const sourceRef = buildXmindStrategySourceRef(valid, { now });
  const linked = actionToEvent({ type: 'quest.create', payload: { quest_id: 'linked', quest_version: 2, title: 'Linked', objectives: [] } }, { actor: 'chatgpt', source: 'test', sourceRef });
  const plain = actionToEvent({ type: 'quest.create', payload: { quest_id: 'plain', title: 'Plain' } }, { actor: 'chatgpt', source: 'test', sourceRef: 'ci:plain' });
  const snapshot = buildSnapshot([linked, plain]);
  assert.equal(snapshot.quests.find((item) => item.id === 'linked').strategy_context.topic_id, valid.topic_id);
  assert.equal(snapshot.quests.find((item) => item.id === 'plain').strategy_context, null);
});
