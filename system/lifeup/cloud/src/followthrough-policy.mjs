export const EVIDENCE_FOLLOWTHROUGH_POLICY_REF = 'system-evidence-followthrough:v1';

function requireObject(value, field) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${field} must be an object`);
  return value;
}

function requireString(value, field, max = 500) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field} is required`);
  const normalized = value.trim();
  if (normalized.length > max) throw new Error(`${field} is too long`);
  return normalized;
}

function normalizeEvidence(value, field) {
  const input = requireObject(value, field);
  if (!['reported', 'verified'].includes(input.status)) throw new Error(`${field}.status must be reported or verified`);
  const source = requireString(input.source ?? 'ron', `${field}.source`, 80);
  const ref = input.ref == null ? null : requireString(input.ref, `${field}.ref`, 500);
  return { status: input.status, source, ref };
}

function normalizeObjectiveEvidence(items = []) {
  if (!Array.isArray(items)) throw new Error('evidence must be an array');
  if (items.length > 32) throw new Error('evidence supports at most 32 objective items');
  const byId = new Map();
  for (let index = 0; index < items.length; index += 1) {
    const item = requireObject(items[index], `evidence[${index}]`);
    const objectiveId = requireString(item.objective_id, `evidence[${index}].objective_id`, 100);
    if (byId.has(objectiveId)) throw new Error('evidence accepts at most one item per objective');
    const value = Number(item.value);
    if (!Number.isInteger(value) || value < 0 || value > 1_000_000_000) {
      throw new Error(`evidence[${index}].value must be an integer between 0 and 1000000000`);
    }
    byId.set(objectiveId, {
      objective_id: objectiveId,
      value,
      evidence: normalizeEvidence(item.evidence, `evidence[${index}].evidence`)
    });
  }
  return byId;
}

export function evaluateEvidenceFollowthrough({ quest, evidence = [], completion_evidence = null } = {}) {
  const current = requireObject(quest, 'quest');
  if (current.quest_version !== 2) {
    return { policy_ref: EVIDENCE_FOLLOWTHROUGH_POLICY_REF, state: 'STOP', reason: 'QUEST_V2_REQUIRED' };
  }
  if (current.status !== 'ACTIVE') {
    return { policy_ref: EVIDENCE_FOLLOWTHROUGH_POLICY_REF, state: 'STOP', reason: 'QUEST_NOT_ACTIVE' };
  }

  const byId = normalizeObjectiveEvidence(evidence);
  const missing = [];
  const needsVerification = [];
  const invalid = [];
  const progress = [];

  for (const objective of (current.objectives ?? []).filter((item) => item.required)) {
    const currentValue = Number(objective.progress ?? 0);
    const target = Number(objective.target);
    const alreadyVerified = currentValue >= target && objective.progress_claim === 'VERIFIED';
    if (alreadyVerified) continue;

    const item = byId.get(objective.objective_id);
    if (!item) {
      if (currentValue >= target && objective.progress_claim === 'REPORTED') {
        needsVerification.push({ objective_id: objective.objective_id, title: objective.title, reason: 'REPORTED_NOT_VERIFIED' });
      } else {
        missing.push({ objective_id: objective.objective_id, title: objective.title, remaining: Math.max(0, target - currentValue) });
      }
      continue;
    }

    if (item.value > target || item.value < currentValue) {
      invalid.push({ objective_id: objective.objective_id, title: objective.title, reason: 'NON_MONOTONIC_OR_OVER_TARGET' });
      continue;
    }
    if (item.value < target) {
      missing.push({ objective_id: objective.objective_id, title: objective.title, remaining: target - item.value });
      continue;
    }
    if (item.evidence.status !== 'verified') {
      needsVerification.push({ objective_id: objective.objective_id, title: objective.title, reason: 'EVIDENCE_NOT_VERIFIED' });
      continue;
    }

    progress.push({
      objective_id: objective.objective_id,
      value: target,
      evidence: item.evidence
    });
  }

  if (invalid.length) {
    return { policy_ref: EVIDENCE_FOLLOWTHROUGH_POLICY_REF, state: 'STOP', reason: 'INVALID_EVIDENCE', invalid };
  }
  if (missing.length) {
    return {
      policy_ref: EVIDENCE_FOLLOWTHROUGH_POLICY_REF,
      state: 'NEEDS_EVIDENCE',
      missing,
      minimum_request: missing.map((item) => item.title)
    };
  }
  if (needsVerification.length) {
    return {
      policy_ref: EVIDENCE_FOLLOWTHROUGH_POLICY_REF,
      state: 'NEEDS_VERIFICATION',
      needs_verification: needsVerification,
      minimum_request: needsVerification.map((item) => item.title)
    };
  }

  let completionEvidence;
  try {
    completionEvidence = normalizeEvidence(completion_evidence, 'completion_evidence');
  } catch {
    return {
      policy_ref: EVIDENCE_FOLLOWTHROUGH_POLICY_REF,
      state: 'NEEDS_VERIFICATION',
      needs_verification: [{ objective_id: null, title: 'quest completion', reason: 'COMPLETION_EVIDENCE_REQUIRED' }],
      minimum_request: ['quest completion']
    };
  }
  if (completionEvidence.status !== 'verified') {
    return {
      policy_ref: EVIDENCE_FOLLOWTHROUGH_POLICY_REF,
      state: 'NEEDS_VERIFICATION',
      needs_verification: [{ objective_id: null, title: 'quest completion', reason: 'COMPLETION_EVIDENCE_NOT_VERIFIED' }],
      minimum_request: ['quest completion']
    };
  }

  return {
    policy_ref: EVIDENCE_FOLLOWTHROUGH_POLICY_REF,
    state: 'RESOLVE_READY',
    action: {
      type: 'quest.resolve',
      payload: {
        quest_id: current.id,
        evidence: completionEvidence,
        progress
      }
    }
  };
}

export function evaluateContinuationGate(input = {}) {
  const candidates = Array.isArray(input.candidates) ? input.candidates : [];
  if (input.completion_verified !== true) {
    return { policy_ref: EVIDENCE_FOLLOWTHROUGH_POLICY_REF, state: 'STOP', reason: 'COMPLETION_NOT_VERIFIED' };
  }
  if (input.mandatory_conflict === true) {
    return { policy_ref: EVIDENCE_FOLLOWTHROUGH_POLICY_REF, state: 'ASK_RON', reason: 'MANDATORY_CONFLICT' };
  }
  if (input.resource_conflict === true) {
    return { policy_ref: EVIDENCE_FOLLOWTHROUGH_POLICY_REF, state: 'ASK_RON', reason: 'RESOURCE_CONFLICT' };
  }
  if (input.material_choice === true) {
    return { policy_ref: EVIDENCE_FOLLOWTHROUGH_POLICY_REF, state: 'ASK_RON', reason: 'MATERIAL_CHOICE' };
  }
  if (input.external_write_required === true) {
    return { policy_ref: EVIDENCE_FOLLOWTHROUGH_POLICY_REF, state: 'ASK_RON', reason: 'EXTERNAL_WRITE_BOUNDARY' };
  }
  if (candidates.length !== 1) {
    return { policy_ref: EVIDENCE_FOLLOWTHROUGH_POLICY_REF, state: 'ASK_RON', reason: candidates.length ? 'MULTIPLE_CANDIDATES' : 'NO_DETERMINISTIC_CANDIDATE' };
  }

  const candidate = requireObject(candidates[0], 'candidates[0]');
  const blockers = [];
  if (candidate.same_trajectory !== true) blockers.push('CROSS_DIRECTION');
  if (candidate.source_status !== 'LIVE') blockers.push('SOURCE_NOT_LIVE');
  if (candidate.policy_valid !== true) blockers.push('QUEST_POLICY_NOT_VALID');
  if (candidate.duplicate_free !== true) blockers.push('DUPLICATE_OR_OUTCOME_CONFLICT');
  if (candidate.safe !== true) blockers.push('SAFETY_NOT_VERIFIED');
  if (candidate.external_write_required === true) blockers.push('EXTERNAL_WRITE_BOUNDARY');
  if (candidate.material_choice === true) blockers.push('MATERIAL_CHOICE');

  if (blockers.length) {
    return { policy_ref: EVIDENCE_FOLLOWTHROUGH_POLICY_REF, state: 'ASK_RON', reason: blockers[0], blockers };
  }

  return {
    policy_ref: EVIDENCE_FOLLOWTHROUGH_POLICY_REF,
    state: 'AUTO_CONTINUE',
    candidate
  };
}
