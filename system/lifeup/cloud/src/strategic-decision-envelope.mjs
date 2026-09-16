const DECISIONS = Object.freeze({
  MANDATORY_PREEMPT: 'MANDATORY_PREEMPT',
  CONTINUE_CURRENT_FOCUS: 'CONTINUE_CURRENT_FOCUS',
  PROPOSE_FOCUS_SWITCH: 'PROPOSE_FOCUS_SWITCH',
  RUN_REVERSIBLE_TEST: 'RUN_REVERSIBLE_TEST',
  RECOMMEND_CANDIDATE: 'RECOMMEND_CANDIDATE',
  RECOMMEND_KEEP_COURSE: 'RECOMMEND_KEEP_COURSE',
  RESOURCE_ALLOCATION_REQUIRED: 'RESOURCE_ALLOCATION_REQUIRED',
  UNKNOWN_NO_COMMIT: 'UNKNOWN_NO_COMMIT'
});

function candidate(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('candidate must be an object');
  if (typeof raw.id !== 'string' || !raw.id.trim()) throw new Error('candidate.id is required');
  return {
    ...raw,
    id: raw.id.trim(),
    feasible: raw.feasible !== false,
    evidence: raw.evidence ?? 'SUFFICIENT',
    valid: raw.valid !== false,
    replacement_case: raw.replacement_case ?? 'NOT_JUSTIFIED',
    best_supported: raw.best_supported === true,
    mandatory_reality: raw.mandatory_reality === true,
    reversible: raw.reversible === true,
    information_gain: raw.information_gain === true,
    engineering_case: raw.engineering_case ?? 'NOT_DEMONSTRATED'
  };
}

function result(decision, selectedIds = [], reason = '') {
  return {
    policy_ref: 'system-strategic-decision-envelope:v1',
    decision,
    selected_ids: selectedIds,
    reason,
    persistent_action_authorized: false
  };
}

export function evaluateStrategicDecisionEnvelope(input = {}) {
  const candidates = (input.candidates ?? []).map(candidate);
  if (candidates.length === 0) return result(DECISIONS.UNKNOWN_NO_COMMIT, [], 'no candidates');

  const mandatory = candidates.filter((item) => item.feasible && item.mandatory_reality);
  if (mandatory.length > 0) {
    return result(
      DECISIONS.MANDATORY_PREEMPT,
      mandatory.map((item) => item.id),
      'mandatory reality gate preempts discretionary comparison'
    );
  }

  if (input.resource_conflict === true) {
    return result(
      DECISIONS.RESOURCE_ALLOCATION_REQUIRED,
      [],
      'credible goals compete for scarce time, money, energy or attention'
    );
  }

  const criticalUnknown = input.decision_critical_unknown === true
    || candidates.some((item) => item.evidence === 'INSUFFICIENT' && item.decision_critical === true);
  if (criticalUnknown) {
    const tests = candidates.filter((item) => item.feasible && item.kind === 'INFO_TEST' && item.reversible && item.information_gain);
    if (tests.length === 1) {
      return result(DECISIONS.RUN_REVERSIBLE_TEST, [tests[0].id], 'high-value uncertainty is reducible by one reversible information-gaining test');
    }
    return result(DECISIONS.UNKNOWN_NO_COMMIT, [], 'decision-critical evidence is insufficient');
  }

  if (input.comparison_scope === 'SYSTEM_ENGINEERING_VS_DIRECT_ACTION') {
    const direct = candidates.filter((item) => item.feasible && item.kind === 'DIRECT_ACTION');
    const engineering = candidates.filter((item) => item.feasible && item.kind === 'SYSTEM_ENGINEERING');
    const demonstratedEngineering = engineering.filter((item) => item.engineering_case === 'DEMONSTRATED');
    if (direct.length === 1 && demonstratedEngineering.length === 0) {
      return result(DECISIONS.RECOMMEND_CANDIDATE, [direct[0].id], 'System engineering has not demonstrated marginal execution value over direct real-world action');
    }
  }

  const current = candidates.find((item) => item.kind === 'CURRENT_FOCUS');
  if (current?.valid) {
    const justified = candidates.filter((item) =>
      item.id !== current.id
      && item.feasible
      && item.kind !== 'INFO_TEST'
      && item.kind !== 'KEEP_CURRENT_COURSE'
      && item.replacement_case === 'JUSTIFIED'
    );
    if (justified.length === 0) {
      return result(DECISIONS.CONTINUE_CURRENT_FOCUS, [current.id], 'valid current focus keeps continuity because no challenger justifies switching cost and lost momentum');
    }
    if (justified.length === 1) {
      return result(DECISIONS.PROPOSE_FOCUS_SWITCH, [justified[0].id], 'one challenger justifies replacing the valid current focus after switching cost');
    }
    return result(DECISIONS.UNKNOWN_NO_COMMIT, [], 'multiple challengers justify switching but no unique best-supported replacement is established');
  }

  const best = candidates.filter((item) => item.feasible && item.best_supported);
  if (best.length === 1) {
    if (best[0].kind === 'KEEP_CURRENT_COURSE') {
      return result(DECISIONS.RECOMMEND_KEEP_COURSE, [best[0].id], 'keep-current-course is the best-supported option');
    }
    return result(DECISIONS.RECOMMEND_CANDIDATE, [best[0].id], 'one feasible candidate is explicitly established as the best-supported current bet');
  }

  return result(DECISIONS.UNKNOWN_NO_COMMIT, [], 'no unique best-supported current bet is established');
}

export { DECISIONS };
