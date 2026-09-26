import { createHash } from 'node:crypto';
import { ATTRIBUTES } from './model.mjs';
import { CALIBRATION_REFS } from './calibration.mjs';
import { ATTRIBUTE_EVIDENCE_KINDS, evaluateAttributeProposal } from './attribute-evidence.mjs';
import { SKILL_EVIDENCE_KINDS, SKILL_EVIDENCE_POLICY_REF, evaluateSkillProposal } from './skill-evidence.mjs';

export const GROWTH_POLICY_REF = 'system-growth:v1';
export const SKILL_MASTERY_POLICY_REF = 'system-skill-mastery:v1';
export const GROWTH_ACTIVATED_AT = '2026-09-26T14:09:00.000Z';

export const SKILL_MASTERY_CURVE = Object.freeze({
  base_xp: 50,
  growth_numerator: 115,
  growth_denominator: 100,
  quantum_xp: 5
});

function trimmedString(value, field, max) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field} is required`);
  const normalized = value.trim();
  if (normalized.length > max) throw new Error(`${field} is too long`);
  return normalized;
}

function normalizedSkillId(value, field) {
  const id = trimmedString(value, field, 100);
  if (!/^[a-z0-9][a-z0-9._:-]*$/.test(id)) throw new Error(`${field} must be normalized lowercase id`);
  return id;
}

function normalizeSkill(value, field) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${field} must be an object`);
  const evidenceKind = value.evidence_kind ?? 'guided_practice';
  if (!SKILL_EVIDENCE_KINDS.includes(evidenceKind)) throw new Error(`${field}.evidence_kind is invalid`);
  return {
    skill_id: normalizedSkillId(value.skill_id, `${field}.skill_id`),
    name: trimmedString(value.name, `${field}.name`, 160),
    domain: trimmedString(value.domain, `${field}.domain`, 120),
    evidence_kind: evidenceKind
  };
}

function normalizeAttribute(value, index) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`growth.attributes[${index}] must be an object`);
  if (!ATTRIBUTES.includes(value.name)) throw new Error(`growth.attributes[${index}].name is invalid`);
  if (!ATTRIBUTE_EVIDENCE_KINDS.includes(value.kind)) throw new Error(`growth.attributes[${index}].kind is invalid`);
  return { name: value.name, kind: value.kind };
}

export function normalizeGrowthMapping(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('growth must be an object');
  if (input.policy_ref != null && input.policy_ref !== GROWTH_POLICY_REF) throw new Error('growth.policy_ref is invalid');

  const primary = input.primary_skill == null ? null : normalizeSkill(input.primary_skill, 'growth.primary_skill');
  const secondaryInput = input.secondary_skills ?? [];
  if (!Array.isArray(secondaryInput) || secondaryInput.length > 2) throw new Error('growth.secondary_skills must contain at most 2 skills');
  const secondary = secondaryInput.map((skill, index) => normalizeSkill(skill, `growth.secondary_skills[${index}]`));

  const attributesInput = input.attributes ?? [];
  if (!Array.isArray(attributesInput) || attributesInput.length > 2) throw new Error('growth.attributes must contain at most 2 attributes');
  const attributes = attributesInput.map(normalizeAttribute);

  const skillIds = [primary, ...secondary].filter(Boolean).map((skill) => skill.skill_id);
  if (new Set(skillIds).size !== skillIds.length) throw new Error('growth skill ids must be unique');
  const attributeNames = attributes.map((item) => item.name);
  if (new Set(attributeNames).size !== attributeNames.length) throw new Error('growth attributes must be unique');
  if (!primary && secondary.length === 0 && attributes.length === 0) throw new Error('growth mapping must target at least one skill or attribute');

  return {
    policy_ref: GROWTH_POLICY_REF,
    primary_skill: primary,
    secondary_skills: secondary,
    attributes
  };
}

function nextMasterySpan(span) {
  const scaled = span * SKILL_MASTERY_CURVE.growth_numerator;
  const quantumScale = SKILL_MASTERY_CURVE.quantum_xp * SKILL_MASTERY_CURVE.growth_denominator;
  return Math.floor((scaled + quantumScale / 2) / quantumScale) * SKILL_MASTERY_CURVE.quantum_xp;
}

export function skillMasterySnapshot(xp) {
  const total = Number(xp);
  if (!Number.isSafeInteger(total) || total < 0) throw new Error('skill mastery xp must be a non-negative safe integer');
  let level = 1;
  let floor = 0;
  let span = SKILL_MASTERY_CURVE.base_xp;
  while (total >= floor + span) {
    floor += span;
    level += 1;
    span = nextMasterySpan(span);
  }
  return {
    level,
    xp: total,
    xp_into_level: total - floor,
    xp_to_next: floor + span - total,
    level_span_xp: span,
    current_level_floor_xp: floor,
    next_level_threshold_xp: floor + span,
    policy_ref: SKILL_MASTERY_POLICY_REF
  };
}

export function secondaryMasteryXp(questXp) {
  const xp = Number(questXp);
  if (!Number.isSafeInteger(xp) || xp <= 0) return 0;
  return Math.floor((xp / 2) / 5) * 5;
}

function orderedEvents(events) {
  return [...(Array.isArray(events) ? events : [])].sort((a,b) => Number(a?.seq || 0) - Number(b?.seq || 0));
}

function explicitState(events) {
  const skills = new Map();
  const attributes = new Map(ATTRIBUTES.map((name) => [name, null]));
  for (const event of orderedEvents(events)) {
    if (event?.event_type === 'skill.upserted') {
      skills.set(event.payload?.skill_id, {
        id: event.payload?.skill_id,
        name: event.payload?.name,
        domain: event.payload?.domain,
        level: event.payload?.level ?? null,
        scale_ref: event.payload?.scale_ref ?? null,
        active: event.payload?.active !== false,
        claim: event.claim_status === 'verified' ? 'VERIFIED' : String(event.claim_status || '').toUpperCase(),
        evidence_ref: event.payload?.evidence?.ref ?? null,
        event_id: event.event_id
      });
    }
    if (event?.event_type === 'attribute.set' && ATTRIBUTES.includes(event.payload?.name)) {
      attributes.set(event.payload.name, event.payload?.value ?? null);
    }
  }
  return { skills, attributes };
}

function highestSkillEligible(skillId, evidence, asOf) {
  let highest = null;
  let evaluation = null;
  for (let level = 1; level <= 5; level += 1) {
    const result = evaluateSkillProposal({ skill_id: skillId, value: level, evidence, as_of: asOf });
    if (result.status !== 'ELIGIBLE') break;
    highest = level;
    evaluation = result;
  }
  return { highest, evaluation };
}

function highestAttributeEligible(name, evidence, asOf) {
  let highest = null;
  let evaluation = null;
  for (let value = 1; value <= 5; value += 1) {
    const result = evaluateAttributeProposal({ name, value, evidence, as_of: asOf });
    if (result.status !== 'ELIGIBLE') break;
    highest = value;
    evaluation = result;
  }
  return { highest, evaluation };
}

function growthRecords(events) {
  const ordered = orderedEvents(events);
  const quests = new Map();
  const assignments = new Map();
  const completionsByQuest = new Map();
  const awardsByBasis = new Map();

  for (const event of ordered) {
    if (event?.event_type === 'quest.created') quests.set(event.payload?.quest_id, event);
    if (event?.event_type === 'quest.growth.assigned') assignments.set(event.payload?.quest_id, event);
    if (event?.event_type === 'quest.completed' && event.claim_status === 'verified') completionsByQuest.set(event.payload?.quest_id, event);
    if (event?.event_type === 'progression.awarded' && event.claim_status === 'verified') awardsByBasis.set(event.payload?.basis_event_id, event);
  }

  const skillMeta = new Map();
  const skillEvidence = new Map();
  const attributeEvidence = new Map(ATTRIBUTES.map((name) => [name, []]));
  const masteryBySkill = new Map();
  const gains = [];

  const registerSkill = (skill, role) => {
    const existing = skillMeta.get(skill.skill_id);
    if (!existing) {
      skillMeta.set(skill.skill_id, { ...skill, roles: new Set([role]), conflict: false });
    } else {
      existing.roles.add(role);
      if (existing.name !== skill.name || existing.domain !== skill.domain) existing.conflict = true;
    }
    if (!skillEvidence.has(skill.skill_id)) skillEvidence.set(skill.skill_id, []);
    if (!masteryBySkill.has(skill.skill_id)) masteryBySkill.set(skill.skill_id, 0);
  };

  for (const assignment of assignments.values()) {
    let mapping;
    try { mapping = normalizeGrowthMapping(assignment.payload?.growth); }
    catch { continue; }
    const questId = assignment.payload?.quest_id;
    const quest = quests.get(questId);
    if (!quest) continue;
    if (mapping.primary_skill) registerSkill(mapping.primary_skill, 'PRIMARY');
    for (const skill of mapping.secondary_skills) registerSkill(skill, 'SECONDARY');

    const completion = completionsByQuest.get(questId);
    if (!completion || Number(completion.seq || 0) <= Number(assignment.seq || 0)) continue;
    const award = awardsByBasis.get(completion.event_id) ?? null;
    const questXp = Number(award?.payload?.xp || 0);
    const gain = {
      quest_id: questId,
      completion_event_id: completion.event_id,
      completion_seq: Number(completion.seq || 0),
      award_event_id: award?.event_id ?? null,
      global_xp: questXp,
      skills: [],
      attributes: []
    };

    const addSkillEvidence = (skill, role, masteryXp) => {
      const ref = `${GROWTH_POLICY_REF};quest=${questId};completion=${completion.event_id};skill=${skill.skill_id};role=${role}`;
      const record = {
        status: 'verified',
        source: 'system-growth-engine',
        ref,
        observed_at: completion.occurred_at,
        kind: skill.evidence_kind,
        skill_id: skill.skill_id,
        basis_event_id: completion.event_id
      };
      skillEvidence.get(skill.skill_id).push(record);
      masteryBySkill.set(skill.skill_id, (masteryBySkill.get(skill.skill_id) || 0) + masteryXp);
      gain.skills.push({
        skill_id: skill.skill_id,
        name: skill.name,
        role,
        mastery_xp: masteryXp,
        evidence_kind: skill.evidence_kind
      });
    };

    if (mapping.primary_skill) addSkillEvidence(mapping.primary_skill, 'PRIMARY', questXp);
    for (const skill of mapping.secondary_skills) addSkillEvidence(skill, 'SECONDARY', secondaryMasteryXp(questXp));

    for (const attribute of mapping.attributes) {
      const ref = `${GROWTH_POLICY_REF};quest=${questId};completion=${completion.event_id};attribute=${attribute.name}`;
      const record = {
        status: 'verified',
        source: 'system-growth-engine',
        ref,
        observed_at: completion.occurred_at,
        kind: attribute.kind,
        attribute: attribute.name,
        basis_event_id: completion.event_id
      };
      attributeEvidence.get(attribute.name).push(record);
      gain.attributes.push({ name: attribute.name, kind: attribute.kind });
    }
    gains.push(gain);
  }

  return { ordered, quests, assignments, skillMeta, skillEvidence, attributeEvidence, masteryBySkill, gains };
}

export function buildGrowthProjection(events = [], { now = Date.now() } = {}) {
  const asOf = new Date(now).toISOString();
  const records = growthRecords(events);
  const explicit = explicitState(events);
  const skills = [];

  for (const [skillId, meta] of records.skillMeta) {
    const evidence = records.skillEvidence.get(skillId) ?? [];
    const masteryXp = records.masteryBySkill.get(skillId) ?? 0;
    const mastery = skillMasterySnapshot(masteryXp);
    const current = explicit.skills.get(skillId) ?? null;
    const eligibility = meta.conflict ? { highest: null, evaluation: null } : highestSkillEligible(skillId, evidence, asOf);
    const currentLevel = current?.level ?? null;
    const evolutionReady = eligibility.highest != null && (currentLevel == null || eligibility.highest > currentLevel);
    skills.push({
      id: skillId,
      name: meta.name,
      domain: meta.domain,
      active: current?.active ?? true,
      claim: current?.claim ?? 'DERIVED',
      evidence_ref: current?.evidence_ref ?? null,
      level: currentLevel,
      scale_ref: current?.scale_ref ?? null,
      mastery_level: mastery.level,
      mastery_xp: mastery.xp,
      mastery_xp_into_level: mastery.xp_into_level,
      mastery_xp_to_next: mastery.xp_to_next,
      mastery_level_span_xp: mastery.level_span_xp,
      mastery_policy_ref: mastery.policy_ref,
      evidence_count: evidence.length,
      highest_eligible_level: eligibility.highest,
      status: meta.conflict ? 'CONFLICT' : evolutionReady ? 'EVOLUTION_READY' : currentLevel == null ? 'TRACKING' : 'CALIBRATED',
      growth_roles: [...meta.roles].sort()
    });
  }

  for (const [skillId, current] of explicit.skills) {
    if (skills.some((skill) => skill.id === skillId)) continue;
    skills.push({
      ...current,
      mastery_level: 1,
      mastery_xp: 0,
      mastery_xp_into_level: 0,
      mastery_xp_to_next: SKILL_MASTERY_CURVE.base_xp,
      mastery_level_span_xp: SKILL_MASTERY_CURVE.base_xp,
      mastery_policy_ref: SKILL_MASTERY_POLICY_REF,
      evidence_count: 0,
      highest_eligible_level: current.level,
      status: current.level == null ? 'TRACKING' : 'CALIBRATED',
      growth_roles: []
    });
  }

  const attributes = {};
  for (const name of ATTRIBUTES) {
    const evidence = records.attributeEvidence.get(name) ?? [];
    const eligibility = highestAttributeEligible(name, evidence, asOf);
    const current = explicit.attributes.get(name) ?? null;
    const evolutionReady = eligibility.highest != null && (current == null || eligibility.highest > current);
    const nextCandidate = current == null ? 1 : Math.min(5, current + 1);
    const nextEvaluation = nextCandidate <= 5
      ? evaluateAttributeProposal({ name, value: nextCandidate, evidence, as_of: asOf })
      : null;
    attributes[name] = {
      current_value: current,
      evidence_count: evidence.length,
      highest_eligible_value: eligibility.highest,
      status: evolutionReady ? 'EVOLUTION_READY' : evidence.length ? 'GATHERING' : 'NO_EVIDENCE',
      next_candidate: nextCandidate,
      next_failed_requirements: nextEvaluation?.status === 'UNRESOLVED' ? nextEvaluation.failed_requirements : []
    };
  }

  return {
    policy_ref: GROWTH_POLICY_REF,
    mastery_policy_ref: SKILL_MASTERY_POLICY_REF,
    skill_evidence_policy_ref: SKILL_EVIDENCE_POLICY_REF,
    attribute_evidence_policy_ref: 'system-attribute-evidence:v1',
    retroactive_mastery: false,
    skills: skills.sort((a,b) => a.name.localeCompare(b.name)),
    attributes,
    last_gain: records.gains.sort((a,b) => a.completion_seq - b.completion_seq).at(-1) ?? null
  };
}

function digestRefs(refs) {
  return createHash('sha256').update([...refs].sort().join('\n')).digest('hex');
}

function growthMutationRef({ basis, type, id, value, refs }) {
  return `${GROWTH_POLICY_REF};basis=${basis};type=${type};id=${id};value=${value};sha256=${digestRefs(refs)}`;
}

export function planGrowthActions(events = [], { now = Date.now(), activationAt = GROWTH_ACTIVATED_AT } = {}) {
  const activationMs = Date.parse(activationAt);
  const asOf = new Date(now).toISOString();
  const records = growthRecords(events);
  const explicit = explicitState(events);
  const plans = [];

  for (const [skillId, meta] of records.skillMeta) {
    if (meta.conflict) continue;
    const evidence = records.skillEvidence.get(skillId) ?? [];
    if (!evidence.length) continue;
    const eligible = highestSkillEligible(skillId, evidence, asOf);
    if (eligible.highest == null) continue;
    const current = explicit.skills.get(skillId);
    if (current?.active === false) continue;
    if (current?.level != null && current.level >= eligible.highest) continue;
    const latest = evidence.at(-1);
    if (Date.parse(latest.observed_at) < activationMs) continue;
    const ref = growthMutationRef({
      basis: latest.basis_event_id,
      type: 'skill',
      id: skillId,
      value: eligible.highest,
      refs: eligible.evaluation?.included_evidence_refs ?? evidence.map((item) => item.ref)
    });
    plans.push({
      basis_event_id: latest.basis_event_id,
      kind: 'SKILL',
      target_id: skillId,
      target_value: eligible.highest,
      idempotencyKey: `${GROWTH_POLICY_REF}:skill:${skillId}:tier:${eligible.highest}`,
      action: {
        type: 'skill.upsert',
        payload: {
          skill_id: skillId,
          name: meta.name,
          domain: meta.domain,
          level: eligible.highest,
          scale_ref: CALIBRATION_REFS.skill,
          active: true,
          evidence: { status: 'verified', source: 'system-growth-engine', ref }
        }
      }
    });
  }

  for (const name of ATTRIBUTES) {
    const evidence = records.attributeEvidence.get(name) ?? [];
    if (!evidence.length) continue;
    const eligible = highestAttributeEligible(name, evidence, asOf);
    if (eligible.highest == null) continue;
    const current = explicit.attributes.get(name);
    if (current != null && current >= eligible.highest) continue;
    const latest = evidence.at(-1);
    if (Date.parse(latest.observed_at) < activationMs) continue;
    const ref = growthMutationRef({
      basis: latest.basis_event_id,
      type: 'attribute',
      id: name,
      value: eligible.highest,
      refs: eligible.evaluation?.included_evidence_refs ?? evidence.map((item) => item.ref)
    });
    plans.push({
      basis_event_id: latest.basis_event_id,
      kind: 'ATTRIBUTE',
      target_id: name,
      target_value: eligible.highest,
      idempotencyKey: `${GROWTH_POLICY_REF}:attribute:${name}:tier:${eligible.highest}`,
      action: {
        type: 'attribute.set',
        payload: {
          name,
          value: eligible.highest,
          scale_ref: CALIBRATION_REFS.attribute,
          evidence: { status: 'verified', source: 'system-growth-engine', ref }
        }
      }
    });
  }

  return plans;
}

function growthFeedbackPlans(events = [], { excludeBases = new Set() } = {}) {
  const ordered = orderedEvents(events);
  const existing = new Set(
    ordered.filter((event) => event?.event_type === 'notification.pushed')
      .map((event) => event.payload?.notification_id)
      .filter(Boolean)
  );
  const groups = new Map();
  for (const event of ordered) {
    if (!['skill.upserted','attribute.set'].includes(event?.event_type)) continue;
    if (event?.source !== 'system-growth-engine') continue;
    const ref = String(event.payload?.evidence?.ref || '');
    const basis = ref.match(/(?:^|;)basis=([^;]+)/)?.[1];
    if (!basis) continue;
    if (!groups.has(basis)) groups.set(basis, []);
    groups.get(basis).push(event);
  }
  const plans = [];
  for (const [basis, mutations] of groups) {
    if (excludeBases.has(basis)) continue;
    const notificationId = `growth-evolution-${createHash('sha256').update(basis).digest('hex').slice(0,32)}`;
    if (existing.has(notificationId)) continue;
    const parts = mutations.map((event) => event.event_type === 'skill.upserted'
      ? `${event.payload.name} → тир ${event.payload.level}`
      : `${event.payload.name} → ${event.payload.value}`);
    plans.push({
      basis_event_id: basis,
      notification_id: notificationId,
      idempotencyKey: `${GROWTH_POLICY_REF}:feedback:${basis}`,
      action: {
        type: 'notification.push',
        payload: {
          notification_id: notificationId,
          title: mutations.length === 1 && mutations[0].event_type === 'skill.upserted'
            ? `Навык повышен: ${mutations[0].payload.name}`
            : mutations.length === 1
              ? `Характеристика повышена: ${mutations[0].payload.name}`
              : 'Эволюция персонажа',
          body: parts.join(' · ').slice(0,1200),
          severity: 'SUCCESS',
          kind: 'REWARD'
        }
      }
    });
  }
  return plans;
}

export function growthGainForAward(events = [], awardEvent) {
  if (!awardEvent || awardEvent.event_type !== 'progression.awarded') return null;
  const records = growthRecords(events);
  const completionId = awardEvent.payload?.basis_event_id;
  const gain = records.gains.find((item) => item.completion_event_id === completionId);
  if (!gain) return null;
  return {
    ...gain,
    skills: gain.skills.filter((skill) => skill.mastery_xp > 0)
  };
}

export async function runGrowthSweep({ store, onNotification = async () => {}, now = Date.now() } = {}) {
  const initial = await store.listAllEvents();
  const mutations = [];
  for (const plan of planGrowthActions(initial, { now })) {
    try {
      const result = await store.applyAction(
        plan.action,
        { actor: 'system', source: 'system-growth-engine', sourceRef: GROWTH_POLICY_REF },
        plan.idempotencyKey
      );
      mutations.push({ ...plan, replay: result.replay, event: result.event });
    } catch (error) {
      mutations.push({ ...plan, error });
    }
  }

  const afterMutations = mutations.some((item) => item.event) ? await store.listAllEvents() : initial;
  const failedBases = new Set(mutations.filter((item) => item.error).map((item) => item.basis_event_id));
  const feedback = [];
  for (const plan of growthFeedbackPlans(afterMutations, { excludeBases: failedBases })) {
    try {
      const result = await store.applyAction(
        plan.action,
        { actor: 'system', source: 'system-growth-engine', sourceRef: GROWTH_POLICY_REF },
        plan.idempotencyKey
      );
      feedback.push({ ...plan, replay: result.replay, event: result.event });
      await onNotification(result.event);
    } catch (error) {
      feedback.push({ ...plan, error });
    }
  }
  return { mutations, feedback };
}

export function startGrowthEngine({ store, intervalMs = 30_000, onNotification, onError = console.error } = {}) {
  let running = false;
  let stopped = false;
  const safeInterval = Math.max(5_000, Number(intervalMs) || 30_000);
  const tick = async () => {
    if (running || stopped) return { mutations: [], feedback: [] };
    running = true;
    try { return await runGrowthSweep({ store, onNotification }); }
    catch (error) { onError(error); return { mutations: [], feedback: [] }; }
    finally { running = false; }
  };
  const timer = setInterval(() => void tick(), safeInterval);
  timer.unref?.();
  return { runNow: tick, stop() { stopped = true; clearInterval(timer); } };
}
