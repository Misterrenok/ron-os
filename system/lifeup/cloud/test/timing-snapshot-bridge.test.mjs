import test from 'node:test';
import assert from 'node:assert/strict';
import { actionToEvent, buildSnapshot } from '../src/quest-v2.mjs';
import { recommendedWindowDeclarationAction } from '../src/timing-pressure.mjs';

const context = { actor: 'test', source: 'timing-snapshot-test', sourceRef: 'ci' };

function stamped(event, seq, occurredAt) {
  event.seq = seq;
  event.occurred_at = occurredAt;
  return event;
}

test('Timing v2 recommended declaration appears in the existing Quest v2 snapshot field', () => {
  const created = stamped(actionToEvent({
    type: 'quest.create',
    payload: { quest_id: 'recommended-q', quest_version: 2, title: 'Немецкий', deadline_at: null, objectives: [] }
  }, context), 1, '2026-09-13T15:00:00Z');
  const first = buildSnapshot([created]).quests[0];
  const declaration = recommendedWindowDeclarationAction({ quest: first, target_at: '2026-09-13T20:00:00+03:00', reason: 'best window' });
  const declared = stamped(actionToEvent(declaration.action, {
    actor: 'test', source: 'system-controller', sourceRef: declaration.source_ref
  }), 2, '2026-09-13T15:00:01Z');

  const quest = buildSnapshot([created, declared]).quests[0];
  assert.equal(quest.soft_target_at, '2026-09-13T17:00:00.000Z');
  assert.equal(quest.soft_target_reason, 'best window');
  assert.equal(quest.soft_target_policy_ref, 'system-timing:v2');
  assert.equal(quest.status, 'ACTIVE');
});
