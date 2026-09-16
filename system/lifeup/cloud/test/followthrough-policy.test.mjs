import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateContinuationGate, evaluateEvidenceFollowthrough } from '../src/followthrough-policy.mjs';

function quest(overrides = {}) {
  return {
    id: 'q-1',
    quest_version: 2,
    status: 'ACTIVE',
    objectives: [
      { objective_id: 'lesson', title: 'Finish lesson', target: 1, required: true, progress: 0, progress_claim: null },
      { objective_id: 'recall', title: 'Recall three phrases', target: 3, required: true, progress: 0, progress_claim: null }
    ],
    ...overrides
  };
}

const completion = { status: 'verified', source: 'chatgpt', ref: 'verified-completion' };

test('follow-through prepares one atomic quest.resolve only when all required evidence is verified', () => {
  const result = evaluateEvidenceFollowthrough({
    quest: quest(),
    completion_evidence: completion,
    evidence: [
      { objective_id: 'lesson', value: 1, evidence: { status: 'verified', source: 'ron', ref: 'direct-report' } },
      { objective_id: 'recall', value: 3, evidence: { status: 'verified', source: 'chatgpt', ref: 'recall-check' } }
    ]
  });

  assert.equal(result.state, 'RESOLVE_READY');
  assert.equal(result.action.type, 'quest.resolve');
  assert.equal(result.action.payload.quest_id, 'q-1');
  assert.equal(result.action.payload.progress.length, 2);
});

test('reported or missing required evidence never prepares resolution', () => {
  const reported = evaluateEvidenceFollowthrough({
    quest: quest(),
    completion_evidence: completion,
    evidence: [
      { objective_id: 'lesson', value: 1, evidence: { status: 'reported', source: 'ron', ref: 'report' } },
      { objective_id: 'recall', value: 3, evidence: { status: 'verified', source: 'chatgpt', ref: 'recall-check' } }
    ]
  });
  assert.equal(reported.state, 'NEEDS_VERIFICATION');
  assert.equal(reported.action, undefined);

  const missing = evaluateEvidenceFollowthrough({
    quest: quest(),
    completion_evidence: completion,
    evidence: [
      { objective_id: 'lesson', value: 1, evidence: { status: 'verified', source: 'ron', ref: 'direct-report' } }
    ]
  });
  assert.equal(missing.state, 'NEEDS_EVIDENCE');
  assert.deepEqual(missing.minimum_request, ['Recall three phrases']);
});

test('already-reported full progress can be prepared for same-value verification upgrade', () => {
  const current = quest({
    objectives: [
      { objective_id: 'lesson', title: 'Finish lesson', target: 1, required: true, progress: 1, progress_claim: 'REPORTED' },
      { objective_id: 'recall', title: 'Recall three phrases', target: 3, required: true, progress: 3, progress_claim: 'VERIFIED' }
    ]
  });
  const result = evaluateEvidenceFollowthrough({
    quest: current,
    completion_evidence: completion,
    evidence: [
      { objective_id: 'lesson', value: 1, evidence: { status: 'verified', source: 'live-owner', ref: 'lesson-complete' } }
    ]
  });

  assert.equal(result.state, 'RESOLVE_READY');
  assert.deepEqual(result.action.payload.progress, [
    {
      objective_id: 'lesson',
      value: 1,
      evidence: { status: 'verified', source: 'live-owner', ref: 'lesson-complete' }
    }
  ]);
});

test('continuation auto-gate opens only for one safe same-trajectory candidate', () => {
  const candidate = {
    id: 'next',
    same_trajectory: true,
    source_status: 'LIVE',
    policy_valid: true,
    duplicate_free: true,
    safe: true,
    external_write_required: false,
    material_choice: false
  };
  const auto = evaluateContinuationGate({ completion_verified: true, candidates: [candidate] });
  assert.equal(auto.state, 'AUTO_CONTINUE');

  assert.equal(evaluateContinuationGate({ completion_verified: true, candidates: [candidate, { ...candidate, id: 'other' }] }).state, 'ASK_RON');
  assert.equal(evaluateContinuationGate({ completion_verified: true, candidates: [{ ...candidate, same_trajectory: false }] }).state, 'ASK_RON');
  assert.equal(evaluateContinuationGate({ completion_verified: true, candidates: [candidate], resource_conflict: true }).state, 'ASK_RON');
  assert.equal(evaluateContinuationGate({ completion_verified: false, candidates: [candidate] }).state, 'STOP');
});
