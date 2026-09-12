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
  const parsed = parseXmindStrategySourceRef(buildXmindStrategySourceRef(valid, { now }), { at: now.toISOString() });
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
  linked.occurred_at = now.toISOString();
  const plain = actionToEvent({ type: 'quest.create', payload: { quest_id: 'plain', title: 'Plain' } }, { actor: 'chatgpt', source: 'test', sourceRef: 'ci:plain' });
  const snapshot = buildSnapshot([linked, plain]);
  assert.equal(snapshot.quests.find((item) => item.id === 'linked').strategy_context.topic_id, valid.topic_id);
  assert.equal(snapshot.quests.find((item) => item.id === 'plain').strategy_context, null);
});

function linkedSnapshot(sourceRef, occurredAt = now.toISOString()) {
  const event = actionToEvent({ type: 'quest.create', payload: { quest_id: 'timed', quest_version: 2, title: 'Timed', objectives: [] } }, { sourceRef });
  event.occurred_at = occurredAt;
  return { event, snapshot: buildSnapshot([event]) };
}

function rewriteRef(sourceRef, key, value) {
  const [prefix, query] = sourceRef.split('?');
  const params = new URLSearchParams(query);
  params.set(key, value);
  return `${prefix}?${params}`;
}

test('raw stale and future references cannot bypass event-time verification', () => {
  const good = buildXmindStrategySourceRef(valid, { now });
  for (const checked of ['2026-09-10T00:00:00Z', '2026-09-13T00:00:00Z']) {
    const raw = rewriteRef(good, 'checked', checked);
    const { event, snapshot } = linkedSnapshot(raw);
    assert.equal(snapshot.quests[0].strategy_context.status, 'UNVERIFIED');
    assert.equal(snapshot.quests[0].strategy_context.topic_id, valid.topic_id);
    assert.equal(event.source_ref, raw, 'raw provenance must not be rewritten');
  }
});

test('missing or invalid event clock cannot certify a stored check', () => {
  const raw = buildXmindStrategySourceRef(valid, { now });
  for (const clock of [null, '', 'bad-date', '2026-02-30T08:00:00Z']) {
    assert.equal(linkedSnapshot(raw, clock).snapshot.quests[0].strategy_context.status, 'UNVERIFIED');
  }
});

test('historical verification is deterministic at event time, not replay time', () => {
  const raw = buildXmindStrategySourceRef(valid, { now });
  const { event, snapshot } = linkedSnapshot(raw);
  const oldNow = Date.now;
  try {
    Date.now = () => new Date('2030-01-01T00:00:00Z').getTime();
    assert.deepEqual(buildSnapshot([event]), snapshot);
    assert.equal(snapshot.quests[0].strategy_context.status, 'VERIFIED');
  } finally { Date.now = oldNow; }
});

test('ambiguous singleton fields and impossible check dates fail closed', () => {
  const raw = buildXmindStrategySourceRef(valid, { now });
  assert.equal(parseXmindStrategySourceRef(`${raw}&status=UNVERIFIED`), null);
  assert.equal(parseXmindStrategySourceRef(rewriteRef(raw, 'checked', '2026-02-30T08:00:00Z')), null);
});

test('event-time freshness boundaries are inclusive with five-minute clock skew', () => {
  const good = buildXmindStrategySourceRef(valid, { now });
  for (const [checked, status] of [
    ['2026-09-11T08:00:00Z', 'VERIFIED'],
    ['2026-09-11T07:59:59Z', 'UNVERIFIED'],
    ['2026-09-12T08:05:00Z', 'VERIFIED'],
    ['2026-09-12T08:05:01Z', 'UNVERIFIED']
  ]) {
    assert.equal(linkedSnapshot(rewriteRef(good, 'checked', checked)).snapshot.quests[0].strategy_context.status, status);
  }
});
