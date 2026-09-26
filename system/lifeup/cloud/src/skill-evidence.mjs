import { createHash } from 'node:crypto';
import { CALIBRATION_REFS } from './calibration.mjs';

export const SKILL_EVIDENCE_POLICY_REF = 'system-skill-evidence:v1';
export const SKILL_EVIDENCE_MAX_AGE_DAYS = 180;

export const SKILL_EVIDENCE_KINDS = Object.freeze([
  'guided_practice',
  'independent_output',
  'objective_benchmark',
  'difficult_outcome',
  'external_validation',
  'exceptional_milestone'
]);

const DAY_MS = 86_400_000;
const KIND_STRENGTH = new Map(SKILL_EVIDENCE_KINDS.map((kind, index) => [kind, index]));
const LEVEL_RULES = Object.freeze({
  1: Object.freeze({ count: 1, span_days: 0, independent: 0, benchmark: 0, difficult: 0, external: 0 }),
  2: Object.freeze({ count: 4, span_days: 7, independent: 2, benchmark: 0, difficult: 0, external: 0 }),
  3: Object.freeze({ count: 6, span_days: 28, independent: 0, benchmark: 1, difficult: 0, external: 0 }),
  4: Object.freeze({ count: 8, span_days: 56, independent: 0, benchmark: 1, difficult: 2, external: 0 }),
  5: Object.freeze({ count: 10, span_days: 84, independent: 0, benchmark: 1, difficult: 2, external: 1 })
});

function trimmedString(value, max) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized || normalized.length > max) return null;
  return normalized;
}

function isoTime(value) {
  const ms = Date.parse(value ?? '');
  if (!Number.isFinite(ms)) return null;
  return { ms, iso: new Date(ms).toISOString() };
}

function strengthAtLeast(kind, minimum) {
  return (KIND_STRENGTH.get(kind) ?? -1) >= KIND_STRENGTH.get(minimum);
}

function normalizeEvidenceRecord(record, skillId, asOfMs) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return { ok: false, reason: 'malformed_evidence' };
  if (record.status !== 'verified') return { ok: false, reason: 'evidence_not_verified', ref: record.ref ?? null };
  const source = trimmedString(record.source, 80);
  const ref = trimmedString(record.ref, 500);
  const observed = isoTime(record.observed_at);
  const kind = SKILL_EVIDENCE_KINDS.includes(record.kind) ? record.kind : null;
  if (!source || !ref || !observed || !kind) return { ok: false, reason: 'malformed_evidence', ref: ref ?? null };
  if (record.skill_id != null && record.skill_id !== skillId) return { ok: false, reason: 'different_skill', ref };
  if (observed.ms > asOfMs) return { ok: false, reason: 'future_evidence', ref };
  if ((asOfMs - observed.ms) / DAY_MS > SKILL_EVIDENCE_MAX_AGE_DAYS) return { ok: false, reason: 'stale_evidence', ref };
  return { ok: true, value: { status: 'verified', source, ref, observed_at: observed.iso, observed_at_ms: observed.ms, kind, skill_id: record.skill_id ?? null } };
}

function evidenceRef(skillId, value, records) {
  const identities = records
    .map((record) => `${record.ref}\t${record.source}\t${record.observed_at}\t${record.kind}\t${record.skill_id ?? '*'}`)
    .sort();
  const digest = createHash('sha256').update(identities.join('\n')).digest('hex');
  return `${SKILL_EVIDENCE_POLICY_REF};skill=${skillId};value=${value};count=${records.length};sha256=${digest}`;
}

export function evaluateSkillProposal(input = {}) {
  const skillId = trimmedString(input.skill_id, 100);
  const value = Number(input.value);
  const asOf = isoTime(input.as_of);
  const result = {
    policy_ref: SKILL_EVIDENCE_POLICY_REF,
    scale_ref: CALIBRATION_REFS.skill,
    status: 'UNRESOLVED',
    skill_id: skillId,
    proposed_value: Number.isInteger(value) ? value : null,
    as_of: asOf?.iso ?? null,
    qualifying_evidence_count: 0,
    evidence_span_days: 0,
    included_evidence_refs: [],
    excluded_evidence: [],
    failed_requirements: [],
    action: null
  };

  if (!skillId) result.failed_requirements.push('valid_skill_id');
  if (!Number.isInteger(value) || value < 1 || value > 5) result.failed_requirements.push('value_1_to_5');
  if (!asOf) result.failed_requirements.push('valid_as_of');
  if (result.failed_requirements.length) return result;

  if (!Array.isArray(input.evidence)) result.failed_requirements.push('evidence_array');
  const normalized = [];
  for (const record of Array.isArray(input.evidence) ? input.evidence : []) {
    const checked = normalizeEvidenceRecord(record, skillId, asOf.ms);
    if (checked.ok) normalized.push(checked.value);
    else result.excluded_evidence.push({ ref: checked.ref ?? null, reason: checked.reason });
  }

  const byRef = new Map();
  const conflicts = new Set();
  for (const record of normalized) {
    const existing = byRef.get(record.ref);
    if (!existing) {
      byRef.set(record.ref, record);
      continue;
    }
    const a = `${existing.source}|${existing.observed_at}|${existing.kind}|${existing.skill_id ?? ''}`;
    const b = `${record.source}|${record.observed_at}|${record.kind}|${record.skill_id ?? ''}`;
    if (a !== b) conflicts.add(record.ref);
  }
  for (const ref of conflicts) {
    byRef.delete(ref);
    result.excluded_evidence.push({ ref, reason: 'conflicting_duplicate_ref' });
  }

  const qualifying = [...byRef.values()].sort((a,b) => a.observed_at_ms - b.observed_at_ms || a.ref.localeCompare(b.ref));
  result.qualifying_evidence_count = qualifying.length;
  result.included_evidence_refs = qualifying.map((record) => record.ref);
  if (qualifying.length > 1) result.evidence_span_days = (qualifying.at(-1).observed_at_ms - qualifying[0].observed_at_ms) / DAY_MS;

  const rule = LEVEL_RULES[value];
  const independent = qualifying.filter((record) => strengthAtLeast(record.kind, 'independent_output')).length;
  const benchmark = qualifying.filter((record) => strengthAtLeast(record.kind, 'objective_benchmark')).length;
  const difficult = qualifying.filter((record) => strengthAtLeast(record.kind, 'difficult_outcome')).length;
  const external = qualifying.filter((record) => strengthAtLeast(record.kind, 'external_validation')).length;

  if (qualifying.length < rule.count) result.failed_requirements.push(`verified_evidence_count>=${rule.count}`);
  if (result.evidence_span_days < rule.span_days) result.failed_requirements.push(`evidence_span_days>=${rule.span_days}`);
  if (independent < rule.independent) result.failed_requirements.push(`independent_output_or_stronger>=${rule.independent}`);
  if (benchmark < rule.benchmark) result.failed_requirements.push(`objective_benchmark_or_stronger>=${rule.benchmark}`);
  if (difficult < rule.difficult) result.failed_requirements.push(`difficult_outcome_or_stronger>=${rule.difficult}`);
  if (external < rule.external) result.failed_requirements.push(`external_validation_or_stronger>=${rule.external}`);
  if (conflicts.size) result.failed_requirements.push('no_conflicting_duplicate_refs');
  if (result.failed_requirements.length) return result;

  result.status = 'ELIGIBLE';
  result.evidence_ref = evidenceRef(skillId, value, qualifying);
  return result;
}
