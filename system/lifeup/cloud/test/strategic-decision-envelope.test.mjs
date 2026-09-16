import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { DECISIONS, evaluateStrategicDecisionEnvelope } from '../src/strategic-decision-envelope.mjs';

function run(candidates, extra = {}) {
  return evaluateStrategicDecisionEnvelope({ candidates, ...extra });
}

test('1 good current focus beats an attractive but non-justified opportunity', () => {
  const out = run([
    { id: 'focus', kind: 'CURRENT_FOCUS', valid: true },
    { id: 'new', kind: 'OPPORTUNITY', replacement_case: 'NOT_JUSTIFIED', best_supported: true }
  ]);
  assert.equal(out.decision, DECISIONS.CONTINUE_CURRENT_FOCUS);
  assert.deepEqual(out.selected_ids, ['focus']);
});

test('2 hard external reality preempts an XMind-aligned discretionary direction', () => {
  const out = run([
    { id: 'xmind', kind: 'OPPORTUNITY', xmind_alignment: 'VERIFIED', best_supported: true },
    { id: 'deadline', kind: 'OBLIGATION', mandatory_reality: true }
  ]);
  assert.equal(out.decision, DECISIONS.MANDATORY_PREEMPT);
  assert.deepEqual(out.selected_ids, ['deadline']);
});

test('3 high uncertainty selects one reversible information-gaining test', () => {
  const out = run([
    { id: 'path-a', kind: 'OPPORTUNITY', evidence: 'INSUFFICIENT', decision_critical: true },
    { id: 'pilot', kind: 'INFO_TEST', reversible: true, information_gain: true }
  ]);
  assert.equal(out.decision, DECISIONS.RUN_REVERSIBLE_TEST);
  assert.deepEqual(out.selected_ids, ['pilot']);
});

test('4 switching cost matters while sunk cost does not protect an invalid course', () => {
  const held = run([
    { id: 'focus', kind: 'CURRENT_FOCUS', valid: true, sunk_cost: 'HIGH' },
    { id: 'challenger', kind: 'OPPORTUNITY', replacement_case: 'NOT_JUSTIFIED' }
  ]);
  assert.equal(held.decision, DECISIONS.CONTINUE_CURRENT_FOCUS);

  const switched = run([
    { id: 'old', kind: 'CURRENT_FOCUS', valid: false, sunk_cost: 'HIGH' },
    { id: 'new', kind: 'OPPORTUNITY', best_supported: true, replacement_case: 'JUSTIFIED' }
  ]);
  assert.equal(switched.decision, DECISIONS.RECOMMEND_CANDIDATE);
  assert.deepEqual(switched.selected_ids, ['new']);
});

test('5 keep-current-course can be the explicit best-supported option', () => {
  const out = run([
    { id: 'keep', kind: 'KEEP_CURRENT_COURSE', best_supported: true },
    { id: 'pivot', kind: 'OPPORTUNITY' }
  ]);
  assert.equal(out.decision, DECISIONS.RECOMMEND_KEEP_COURSE);
});

test('6 direct real-world action beats System engineering without demonstrated marginal value', () => {
  const out = run([
    { id: 'engineer', kind: 'SYSTEM_ENGINEERING', engineering_case: 'NOT_DEMONSTRATED' },
    { id: 'act', kind: 'DIRECT_ACTION' }
  ], { comparison_scope: 'SYSTEM_ENGINEERING_VS_DIRECT_ACTION' });
  assert.equal(out.decision, DECISIONS.RECOMMEND_CANDIDATE);
  assert.deepEqual(out.selected_ids, ['act']);
});

test('7 conflicting scarce resources require allocation rather than silently stacking goals', () => {
  const out = run([
    { id: 'goal-a', kind: 'OPPORTUNITY' },
    { id: 'goal-b', kind: 'OPPORTUNITY' }
  ], { resource_conflict: true });
  assert.equal(out.decision, DECISIONS.RESOURCE_ALLOCATION_REQUIRED);
});

test('8 insufficient decision-critical data does not fabricate a winner', () => {
  const out = run([
    { id: 'a', kind: 'OPPORTUNITY', evidence: 'INSUFFICIENT', decision_critical: true },
    { id: 'b', kind: 'OPPORTUNITY' }
  ], { decision_critical_unknown: true });
  assert.equal(out.decision, DECISIONS.UNKNOWN_NO_COMMIT);
  assert.deepEqual(out.selected_ids, []);
});

test('envelope never grants persistent write authority', () => {
  const cases = [
    run([{ id: 'keep', kind: 'KEEP_CURRENT_COURSE', best_supported: true }]),
    run([{ id: 'deadline', kind: 'OBLIGATION', mandatory_reality: true }]),
    run([{ id: 'focus', kind: 'CURRENT_FOCUS', valid: true }])
  ];
  for (const out of cases) assert.equal(out.persistent_action_authorized, false);
});

test('runtime routing loads the envelope for System orchestration and XMind strategy comparisons', () => {
  const strategicContext = readFileSync(new URL('../../STRATEGIC_CONTEXT_ORCHESTRATION_SPEC.md', import.meta.url), 'utf8');
  const xmindSkill = readFileSync(new URL('../../../../skills/xmind.md', import.meta.url), 'utf8');
  for (const needle of [
    'STRATEGIC_DECISION_ENVELOPE_V1.md',
    'system-strategic-decision-envelope:v1',
    'implicitly persisting a `quest.focus` change',
    'UNKNOWN_NO_COMMIT'
  ]) assert.ok(strategicContext.includes(needle), `missing strategic runtime marker: ${needle}`);
  for (const needle of [
    'STRATEGIC_LIFE_TRAJECTORY_PLAN_V1.md',
    'STRATEGIC_DECISION_ENVELOPE_V1.md',
    'important choices remain Ron'
  ]) assert.ok(xmindSkill.includes(needle), `missing XMind strategic envelope marker: ${needle}`);
});
