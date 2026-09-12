import test from 'node:test';
import assert from 'node:assert/strict';
import { ATTRIBUTE_EVIDENCE_POLICY_REF, evaluateAttributeProposal } from '../src/attribute-evidence.mjs';

const asOf = '2026-09-12T09:00:00Z';
const rec = (ref, daysAgo, kind = 'baseline', extra = {}) => ({
  status: 'verified',
  source: 'test-owner',
  ref,
  observed_at: new Date(Date.parse(asOf) - daysAgo * 86_400_000).toISOString(),
  kind,
  ...extra
});

function evalLevel(value, evidence, extra = {}) {
  return evaluateAttributeProposal({ name: 'DISC', value, as_of: asOf, evidence, ...extra });
}

test('level 1 requires one fresh verified baseline or stronger record', () => {
  const out = evalLevel(1, [rec('r1', 2)]);
  assert.equal(out.status, 'ELIGIBLE');
  assert.equal(out.qualifying_evidence_count, 1);
  assert.equal(out.action.type, 'attribute.set');
  assert.deepEqual(out.action.payload, {
    name: 'DISC',
    value: 1,
    scale_ref: 'system-attribute-ordinal5:v1',
    evidence: {
      status: 'verified',
      source: 'system-attribute-evidence',
      ref: out.action.payload.evidence.ref
    }
  });
  assert.match(out.action.payload.evidence.ref, /^system-attribute-evidence:v1;name=DISC;value=1;count=1;sha256=[0-9a-f]{64}$/);
});

test('level 2 requires two records and repeated execution or stronger', () => {
  const weak = evalLevel(2, [rec('a', 3), rec('b', 1)]);
  assert.equal(weak.status, 'UNRESOLVED');
  assert.ok(weak.failed_requirements.includes('repeated_execution_or_stronger>=1'));
  const strong = evalLevel(2, [rec('a', 3), rec('b', 1, 'repeated_execution')]);
  assert.equal(strong.status, 'ELIGIBLE');
});

test('level 3 requires three records, 28-day span, and objective benchmark or stronger', () => {
  const short = evalLevel(3, [rec('a', 27), rec('b', 14, 'repeated_execution'), rec('c', 0, 'objective_benchmark')]);
  assert.equal(short.status, 'UNRESOLVED');
  assert.ok(short.failed_requirements.includes('evidence_span_days>=28'));
  const exact = evalLevel(3, [rec('a', 28), rec('b', 14, 'repeated_execution'), rec('c', 0, 'objective_benchmark')]);
  assert.equal(exact.status, 'ELIGIBLE');
  assert.equal(exact.evidence_span_days, 28);
});

test('level 4 requires 56 days and two difficult outcomes or stronger', () => {
  const out = evalLevel(4, [
    rec('a', 56, 'baseline'),
    rec('b', 42, 'objective_benchmark'),
    rec('c', 21, 'difficult_outcome'),
    rec('d', 0, 'external_validation')
  ]);
  assert.equal(out.status, 'ELIGIBLE');
});

test('level 5 requires 84 days, five records, two difficult+, and external validation+', () => {
  const out = evalLevel(5, [
    rec('a', 84, 'baseline'),
    rec('b', 63, 'objective_benchmark'),
    rec('c', 42, 'difficult_outcome'),
    rec('d', 21, 'difficult_outcome'),
    rec('e', 0, 'exceptional_milestone')
  ]);
  assert.equal(out.status, 'ELIGIBLE');
});

test('stale, future, unverified, malformed, and wrong-attribute evidence fail closed', () => {
  const out = evalLevel(1, [
    rec('stale', 181),
    rec('future', -1),
    { ...rec('reported', 2), status: 'reported' },
    { ...rec('wrong', 2), attribute: 'STR' },
    { status: 'verified', source: '', ref: 'broken', observed_at: asOf, kind: 'baseline' }
  ]);
  assert.equal(out.status, 'UNRESOLVED');
  assert.equal(out.qualifying_evidence_count, 0);
  assert.deepEqual(new Set(out.excluded_evidence.map((item) => item.reason)), new Set([
    'stale_evidence', 'future_evidence', 'evidence_not_verified', 'different_attribute', 'malformed_evidence'
  ]));
});

test('evidence exactly 180 days old remains eligible', () => {
  assert.equal(evalLevel(1, [rec('edge', 180)]).status, 'ELIGIBLE');
});

test('duplicate refs count once while conflicting duplicate refs fail closed', () => {
  const duplicate = rec('same', 2, 'repeated_execution');
  const same = evalLevel(2, [duplicate, { ...duplicate }, rec('other', 1)]);
  assert.equal(same.status, 'ELIGIBLE');
  assert.equal(same.qualifying_evidence_count, 2);

  const conflict = evalLevel(1, [rec('collision', 2), rec('collision', 3, 'objective_benchmark')]);
  assert.equal(conflict.status, 'UNRESOLVED');
  assert.ok(conflict.failed_requirements.includes('no_conflicting_duplicate_refs'));
  assert.equal(conflict.qualifying_evidence_count, 0);
});

test('input ordering cannot change eligible action or evidence digest', () => {
  const evidence = [rec('a', 28), rec('b', 14, 'repeated_execution'), rec('c', 0, 'objective_benchmark')];
  const forward = evalLevel(3, evidence);
  const reverse = evalLevel(3, [...evidence].reverse());
  assert.deepEqual(reverse, forward);
});

test('invalid top-level proposal fails closed without an action', () => {
  const bad = evaluateAttributeProposal({ name: 'LUCK', value: 6, as_of: 'bad', evidence: [] });
  assert.equal(bad.status, 'UNRESOLVED');
  assert.equal(bad.action, null);
  assert.equal(bad.requires_exact_mutation_permission, false);
  assert.deepEqual(bad.failed_requirements, ['valid_attribute_name', 'value_1_to_5', 'valid_as_of']);
});

test('non-array evidence fails closed', () => {
  const out = evaluateAttributeProposal({ name: 'INT', value: 1, as_of: asOf, evidence: {} });
  assert.equal(out.status, 'UNRESOLVED');
  assert.ok(out.failed_requirements.includes('evidence_array'));
  assert.ok(out.failed_requirements.includes('verified_evidence_count>=1'));
});

test('policy and output remain permission-gated, never automatic', () => {
  const out = evalLevel(1, [rec('r1', 1)]);
  assert.equal(out.policy_ref, ATTRIBUTE_EVIDENCE_POLICY_REF);
  assert.equal(out.requires_exact_mutation_permission, true);
  assert.equal(out.action.payload.value, 1);
  assert.equal(Object.prototype.hasOwnProperty.call(out, 'next_value'), false);
});
