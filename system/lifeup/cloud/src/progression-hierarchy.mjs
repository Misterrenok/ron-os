import { createHash } from 'node:crypto';

export const PROGRESSION_HIERARCHY_POLICY_REF = 'system-progression-hierarchy:v1';

function normalizedEvents(events) {
  return Array.isArray(events) ? events : [];
}

function trimmedString(value, max = 500) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized || normalized.length > max) return null;
  return normalized;
}

function eventId(event) {
  return trimmedString(event?.event_id, 160);
}

function occurredAt(event) {
  const ms = Date.parse(event?.occurred_at ?? '');
  return Number.isFinite(ms) ? { ms, iso: new Date(ms).toISOString() } : null;
}

function deriveOutcomeKey(createEvent) {
  const direct = trimmedString(createEvent?.payload?.outcome_key, 240);
  if (direct) return direct;
  for (const raw of [createEvent?.source_ref, createEvent?.payload?.description]) {
    if (typeof raw !== 'string') continue;
    const match = raw.match(/(?:^|[;?\s])outcome_key=([^;\s]+)/i);
    const derived = trimmedString(match?.[1], 240);
    if (derived) return derived;
  }
  return null;
}

function verifiedEvidence(record, label) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    return { ok: false, reason: `${label}_verified_evidence` };
  }
  const source = trimmedString(record.source, 80);
  const ref = trimmedString(record.ref, 500);
  if (record.status !== 'verified' || !source || !ref) {
    return { ok: false, reason: `${label}_verified_evidence` };
  }
  return { ok: true, value: { status: 'verified', source, ref } };
}

function uniqueVerifiedEvidence(records, label) {
  if (!Array.isArray(records)) return { values: [], failed: [`${label}_array`] };
  const values = [];
  const failed = [];
  const byRef = new Map();
  for (const record of records) {
    const checked = verifiedEvidence(record, label);
    if (!checked.ok) {
      failed.push(checked.reason);
      continue;
    }
    const existing = byRef.get(checked.value.ref);
    if (existing && existing.source !== checked.value.source) {
      failed.push(`${label}_no_conflicting_duplicate_refs`);
      byRef.delete(checked.value.ref);
      continue;
    }
    if (!existing) byRef.set(checked.value.ref, checked.value);
  }
  values.push(...[...byRef.values()].sort((a, b) => a.ref.localeCompare(b.ref) || a.source.localeCompare(b.source)));
  return { values, failed: [...new Set(failed)] };
}

function evidenceDigest(kind, identity, refs) {
  const stable = [...refs].sort();
  const digest = createHash('sha256').update(stable.join('\n')).digest('hex');
  return `${PROGRESSION_HIERARCHY_POLICY_REF};kind=${kind};id=${encodeURIComponent(identity)};count=${stable.length};sha256=${digest}`;
}

export function verifiedRewardedQuestOutcomes(events = []) {
  const input = normalizedEvents(events);
  const createsByQuest = new Map();
  const completionsById = new Map();
  const rewardedBasisIds = new Set();

  for (const event of input) {
    if (event?.event_type === 'quest.created' && event?.payload?.quest_id) {
      createsByQuest.set(event.payload.quest_id, event);
      continue;
    }
    if (event?.event_type === 'quest.completed' && event?.claim_status === 'verified') {
      const id = eventId(event);
      if (id) completionsById.set(id, event);
      continue;
    }
    if (event?.event_type === 'progression.awarded' && event?.claim_status === 'verified') {
      const basis = trimmedString(event?.payload?.basis_event_id, 160);
      if (basis) rewardedBasisIds.add(basis);
    }
  }

  const outcomes = [];
  for (const completionId of rewardedBasisIds) {
    const completion = completionsById.get(completionId);
    if (!completion) continue;
    const questId = trimmedString(completion?.payload?.quest_id, 100);
    const create = questId ? createsByQuest.get(questId) : null;
    if (!create || create?.payload?.quest_version !== 2) continue;
    const time = occurredAt(completion);
    if (!time) continue;
    outcomes.push({
      quest_id: questId,
      outcome_key: deriveOutcomeKey(create),
      rank: create?.payload?.rank ?? null,
      class: create?.payload?.class ?? null,
      completion_event_id: completionId,
      completed_at: time.iso,
      completed_at_ms: time.ms
    });
  }

  outcomes.sort((a, b) => a.completed_at_ms - b.completed_at_ms || a.quest_id.localeCompare(b.quest_id));
  return outcomes;
}

function baseResult(tier) {
  return {
    policy_ref: PROGRESSION_HIERARCHY_POLICY_REF,
    tier,
    status: 'UNVERIFIED',
    read_only: true,
    failed_requirements: [],
    basis_completion_event_ids: [],
    evidence_ref: null,
    reward_delta: { xp: 0, coins: 0 },
    action: null
  };
}

export function evaluateBossEligibility(input = {}) {
  const result = {
    ...baseResult('BOSS_QUEST'),
    quest_id: trimmedString(input?.quest_id, 100),
    outcome_key: null,
    qualification_mode: null,
    capability_refs: [],
    barrier_ref: null,
    baseline_ref: null
  };

  if (!result.quest_id) {
    result.failed_requirements.push('quest_id');
    return result;
  }

  const outcome = verifiedRewardedQuestOutcomes(input?.events)
    .find((item) => item.quest_id === result.quest_id);
  if (!outcome) result.failed_requirements.push('verified_rewarded_quest_v2_completion');
  else {
    result.outcome_key = outcome.outcome_key;
    result.basis_completion_event_ids = [outcome.completion_event_id];
    if (!outcome.outcome_key) result.failed_requirements.push('stable_outcome_key');
  }

  const capabilityInput = input?.capabilities == null ? [] : input.capabilities;
  const capabilities = uniqueVerifiedEvidence(capabilityInput, 'capability');
  result.capability_refs = capabilities.values.map((record) => record.ref);
  result.failed_requirements.push(...capabilities.failed);
  const hasMultiCapability = capabilities.values.length >= 2;

  const barrier = verifiedEvidence(input?.major_barrier, 'major_barrier');
  const baseline = verifiedEvidence(input?.baseline, 'baseline');
  const hasBarrierPath = barrier.ok && baseline.ok;
  if (barrier.ok) result.barrier_ref = barrier.value.ref;
  if (baseline.ok) result.baseline_ref = baseline.value.ref;

  if (!hasMultiCapability && !hasBarrierPath) {
    result.failed_requirements.push('multi_capability_or_verified_major_barrier_vs_baseline');
  } else if (hasMultiCapability) {
    result.qualification_mode = 'MULTI_CAPABILITY';
  } else {
    result.qualification_mode = 'MAJOR_BARRIER';
  }

  const existing = new Set(
    Array.isArray(input?.existing_boss_outcome_keys)
      ? input.existing_boss_outcome_keys.map((value) => trimmedString(value, 240)).filter(Boolean)
      : []
  );
  if (result.outcome_key && existing.has(result.outcome_key)) {
    result.failed_requirements.push('no_duplicate_boss_outcome');
  }

  result.failed_requirements = [...new Set(result.failed_requirements)].sort();
  if (result.failed_requirements.length) return result;

  const refs = [
    ...result.basis_completion_event_ids,
    ...result.capability_refs,
    ...(result.barrier_ref ? [result.barrier_ref] : []),
    ...(result.baseline_ref ? [result.baseline_ref] : [])
  ];
  result.status = 'ELIGIBLE';
  result.evidence_ref = evidenceDigest('boss', result.outcome_key, refs);
  return result;
}

export function evaluateArcMilestoneEligibility(input = {}) {
  const milestoneId = trimmedString(input?.milestone_id, 160);
  const result = {
    ...baseResult('ARC_MILESTONE'),
    milestone_id: milestoneId,
    basis_quest_ids: [],
    phase_transition_ref: null
  };

  if (!milestoneId) result.failed_requirements.push('milestone_id');
  if (!Array.isArray(input?.basis_quest_ids)) {
    result.failed_requirements.push('basis_quest_ids_array');
  } else {
    result.basis_quest_ids = [...new Set(
      input.basis_quest_ids.map((value) => trimmedString(value, 100)).filter(Boolean)
    )].sort();
    if (result.basis_quest_ids.length < 2) result.failed_requirements.push('multiple_verified_underlying_outcomes');
  }

  const transition = verifiedEvidence(input?.phase_transition, 'phase_transition');
  if (!transition.ok) result.failed_requirements.push(transition.reason);
  else result.phase_transition_ref = transition.value.ref;

  const outcomes = verifiedRewardedQuestOutcomes(input?.events);
  const outcomeByQuest = new Map(outcomes.map((item) => [item.quest_id, item]));
  const missing = result.basis_quest_ids.filter((questId) => !outcomeByQuest.has(questId));
  if (missing.length) result.failed_requirements.push('all_basis_quests_verified_rewarded_quest_v2');
  if (!missing.length) {
    result.basis_completion_event_ids = result.basis_quest_ids
      .map((questId) => outcomeByQuest.get(questId)?.completion_event_id)
      .filter(Boolean)
      .sort();
  }

  const existing = new Set(
    Array.isArray(input?.existing_arc_ids)
      ? input.existing_arc_ids.map((value) => trimmedString(value, 160)).filter(Boolean)
      : []
  );
  if (milestoneId && existing.has(milestoneId)) result.failed_requirements.push('no_duplicate_arc_milestone');

  result.failed_requirements = [...new Set(result.failed_requirements)].sort();
  if (result.failed_requirements.length) return result;

  const refs = [...result.basis_completion_event_ids, result.phase_transition_ref];
  result.status = 'ELIGIBLE';
  result.evidence_ref = evidenceDigest('arc', milestoneId, refs);
  return result;
}

export function progressionHierarchySnapshot(input = {}) {
  const events = normalizedEvents(input?.events);
  const quests = verifiedRewardedQuestOutcomes(events).map(({ completed_at_ms, ...item }) => item);
  const boss = Array.isArray(input?.boss_candidates)
    ? input.boss_candidates.map((candidate) => evaluateBossEligibility({ ...candidate, events }))
    : [];
  const arcs = Array.isArray(input?.arc_candidates)
    ? input.arc_candidates.map((candidate) => evaluateArcMilestoneEligibility({ ...candidate, events }))
    : [];
  return {
    policy_ref: PROGRESSION_HIERARCHY_POLICY_REF,
    read_only: true,
    verified_rewarded_quest_v2_outcomes: quests,
    boss_candidates: boss,
    arc_candidates: arcs,
    rank_evolution: {
      status: 'NOT_EVALUATED',
      reason: 'writable_rank_policy_not_promoted',
      action: null
    }
  };
}
