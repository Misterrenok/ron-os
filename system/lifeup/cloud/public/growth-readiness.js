const REQUIREMENT_PATTERNS = Object.freeze([
  [/^verified_evidence_count>=(\d+)$/u, (n) => `подтверждённых результатов ≥${n}`],
  [/^evidence_span_days>=(\d+)$/u, (n) => `период доказательств ≥${n} дн.`],
  [/^independent_output_or_stronger>=(\d+)$/u, (n) => `самостоятельных результатов ≥${n}`],
  [/^repeated_execution_or_stronger>=(\d+)$/u, (n) => `повторных выполнений ≥${n}`],
  [/^objective_benchmark_or_stronger>=(\d+)$/u, (n) => `объективных проверок ≥${n}`],
  [/^difficult_outcome_or_stronger>=(\d+)$/u, (n) => `сложных результатов ≥${n}`],
  [/^external_validation_or_stronger>=(\d+)$/u, (n) => `внешних подтверждений ≥${n}`]
]);

export function growthRequirementPlayerText(requirement) {
  const value = String(requirement || '').trim();
  for (const [pattern, render] of REQUIREMENT_PATTERNS) {
    const match = value.match(pattern);
    if (match) return render(Number(match[1]));
  }
  if (value === 'no_conflicting_duplicate_refs') return 'устранить конфликт доказательств';
  return value ? 'нужно дополнительное подтверждение' : '';
}

export function growthReadinessPlayerView({
  next_candidate: nextCandidate,
  next_failed_requirements: failedRequirements,
  status,
  highest_eligible_level: highestEligibleLevel,
  highest_eligible_value: highestEligibleValue
} = {}) {
  if (status === 'EVOLUTION_READY') {
    const value = highestEligibleLevel ?? highestEligibleValue ?? nextCandidate;
    return {
      ready: true,
      label: value == null ? 'ГОТОВО К ПОВЫШЕНИЮ' : `ТИР ${value} ГОТОВ К ПОВЫШЕНИЮ`,
      requirements: []
    };
  }

  if (nextCandidate == null) {
    return { ready: false, label: 'МАКСИМАЛЬНЫЙ ТИР', requirements: [] };
  }

  const requirements = [...new Set(
    (Array.isArray(failedRequirements) ? failedRequirements : [])
      .map(growthRequirementPlayerText)
      .filter(Boolean)
  )];

  return {
    ready: false,
    label: requirements.length
      ? `ДО ТИРА ${nextCandidate}: ${requirements.join(' · ')}`
      : `ДО ТИРА ${nextCandidate}: условия доказательств выполнены`,
    requirements
  };
}
