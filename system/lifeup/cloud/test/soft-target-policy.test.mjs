import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SOFT_TARGET_POLICY_VERSION,
  buildSoftTargetSourceRef,
  deriveLatestSoftTargets,
  parseSoftTargetSourceRef,
  softTargetDeclarationAction
} from '../src/soft-target.mjs';

test('soft target source ref round-trips', () => {
  const ref = buildSoftTargetSourceRef({ quest_id: 'q1', target_at: '2026-09-12T18:30:00Z', reason: 'today' });
  assert.ok(ref.startsWith(`${SOFT_TARGET_POLICY_VERSION}?`));
  assert.deepEqual(parseSoftTargetSourceRef(ref), {
    policy_ref: SOFT_TARGET_POLICY_VERSION,
    quest_id: 'q1',
    target_at: '2026-09-12T18:30:00.000Z',
    reason: 'today'
  });
  assert.equal(parseSoftTargetSourceRef('policy:deadline-v1'), null);
});

test('latest declaration wins without changing quest state', () => {
  const make = (target, seq) => {
    const declaration = softTargetDeclarationAction({ quest: { id: 'q1', title: 'Quest' }, target_at: target });
    return {
      seq,
      event_id: `event-${seq}`,
      event_type: 'notification.pushed',
      source_ref: declaration.source_ref,
      payload: declaration.action.payload
    };
  };
  const latest = deriveLatestSoftTargets([
    make('2026-09-12T17:30:00Z', 2),
    make('2026-09-12T18:30:00Z', 3)
  ]);
  assert.equal(latest.size, 1);
  assert.equal(latest.get('q1').target_at, '2026-09-12T18:30:00.000Z');
  assert.equal(latest.get('q1').seq, 3);
});
