import test from 'node:test';
import assert from 'node:assert/strict';
import { strategyContextView } from '../public/strategy-context.js';

test('verified context becomes a safe XMind link', () => {
  const view = strategyContextView({
    policy_ref: 'system-xmind-strategy-bridge:v1', file_id: 'SzWCLc5N', topic_label: 'Немецкий A1',
    status: 'VERIFIED', mode: 'READ_ONLY', conflict_status: 'CLEAR', owner_refs: ['domains/learning.md']
  });
  assert.equal(view.href, 'https://app.xmind.com/share/SzWCLc5N');
  assert.equal(view.verified, true);
  assert.equal(view.status_label, 'ПРОВЕРЕНО ПО КАНОНУ');
});

test('unverified context is visibly unverified and unsafe file ids do not link', () => {
  assert.equal(strategyContextView({ policy_ref: 'system-xmind-strategy-bridge:v1', file_id: 'javascript:alert(1)' }), null);
  const view = strategyContextView({
    policy_ref: 'system-xmind-strategy-bridge:v1', file_id: 'SzWCLc5N', status: 'UNVERIFIED',
    mode: 'READ_ONLY', conflict_status: 'UNKNOWN', owner_refs: []
  });
  assert.equal(view.verified, false);
  assert.equal(view.status_label, 'СВЯЗЬ НЕ ПРОВЕРЕНА');
});
