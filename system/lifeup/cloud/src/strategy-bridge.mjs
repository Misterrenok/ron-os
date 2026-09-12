const PREFIX = 'system-xmind-strategy:v1?';
const MAX_SOURCE_REF = 500;
const FILE_ID = /^[A-Za-z0-9_-]{4,100}$/;
const TOPIC_ID = /^[A-Za-z0-9_-]{8,100}$/;
const OWNER_REF = /^(?:PERSON\.md|CURRENT\.md|domains\/[A-Za-z0-9._-]+\.md|projects\/[A-Za-z0-9._/-]+\.md)$/;

function required(value, field, max = 180) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field} is required`);
  const normalized = value.trim();
  if (normalized.length > max || /[\r\n]/.test(normalized)) throw new Error(`${field} is invalid`);
  return normalized;
}

function id(value, field, pattern) {
  const normalized = required(value, field, 100);
  if (!pattern.test(normalized)) throw new Error(`${field} is invalid`);
  return normalized;
}

function timestamp(value, field) {
  const parsed = new Date(required(value, field, 40));
  if (Number.isNaN(parsed.getTime())) throw new Error(`${field} must be a valid timestamp`);
  return parsed.toISOString();
}

function unique(values) {
  return [...new Set(values)];
}

export function parseXmindStrategySourceRef(sourceRef) {
  if (typeof sourceRef !== 'string' || !sourceRef.startsWith(PREFIX) || sourceRef.length > MAX_SOURCE_REF) return null;
  try {
    const params = new URLSearchParams(sourceRef.slice(PREFIX.length));
    const fileId = id(params.get('file'), 'file', FILE_ID);
    const sheetId = id(params.get('sheet'), 'sheet', TOPIC_ID);
    const topicId = id(params.get('topic'), 'topic', TOPIC_ID);
    const topicLabel = required(params.get('label'), 'label', 180);
    const checkedAt = timestamp(params.get('checked'), 'checked');
    const status = required(params.get('status'), 'status', 20);
    const conflictStatus = required(params.get('conflict'), 'conflict', 20);
    const mode = required(params.get('mode'), 'mode', 20);
    const ownerRefs = unique(params.getAll('owner').map((item) => required(item, 'owner', 160)));
    const policyRefs = unique(params.getAll('policy').map((item) => required(item, 'policy', 100)));
    if (!['VERIFIED', 'UNVERIFIED'].includes(status)) throw new Error('status is invalid');
    if (!['CLEAR', 'CONFLICT', 'UNKNOWN'].includes(conflictStatus)) throw new Error('conflict is invalid');
    if (mode !== 'READ_ONLY') throw new Error('mode must be READ_ONLY');
    if (ownerRefs.length > 6 || ownerRefs.some((item) => !OWNER_REF.test(item))) throw new Error('owner is invalid');
    if (policyRefs.length > 6) throw new Error('too many policy refs');
    if (status === 'VERIFIED' && (conflictStatus !== 'CLEAR' || ownerRefs.length === 0)) {
      throw new Error('verified strategy context requires clear owner verification');
    }
    return {
      policy_ref: 'system-xmind-strategy-bridge:v1',
      status,
      mode,
      conflict_status: conflictStatus,
      checked_at: checkedAt,
      file_id: fileId,
      sheet_id: sheetId,
      topic_id: topicId,
      topic_label: topicLabel,
      owner_refs: ownerRefs,
      policy_refs: policyRefs
    };
  } catch {
    return null;
  }
}

export function buildXmindStrategySourceRef(input, { now = new Date() } = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('strategy context is required');
  const mode = input.mode ?? 'READ_ONLY';
  if (mode !== 'READ_ONLY') throw new Error('XMind strategy bridge is read-only');
  const status = input.status ?? 'VERIFIED';
  const conflictStatus = input.conflict_status ?? 'UNKNOWN';
  const checkedAt = timestamp(input.checked_at ?? now.toISOString(), 'checked_at');
  const checkedMs = new Date(checkedAt).getTime();
  const nowMs = new Date(now).getTime();
  if (!Number.isFinite(nowMs)) throw new Error('now must be valid');
  if (checkedMs > nowMs + 5 * 60_000) throw new Error('checked_at cannot be in the future');
  if (status === 'VERIFIED' && nowMs - checkedMs > 24 * 60 * 60_000) throw new Error('verified strategy check is stale');

  const owners = unique((input.owner_refs ?? []).map((item) => required(item, 'owner_ref', 160)));
  const policies = unique((input.policy_refs ?? ['system-quest-difficulty:v1']).map((item) => required(item, 'policy_ref', 100)));
  const params = new URLSearchParams();
  params.set('file', id(input.file_id, 'file_id', FILE_ID));
  params.set('sheet', id(input.sheet_id, 'sheet_id', TOPIC_ID));
  params.set('topic', id(input.topic_id, 'topic_id', TOPIC_ID));
  params.set('label', required(input.topic_label, 'topic_label', 180));
  params.set('checked', checkedAt);
  params.set('status', status);
  params.set('conflict', conflictStatus);
  params.set('mode', mode);
  for (const owner of owners) params.append('owner', owner);
  for (const policy of policies) params.append('policy', policy);
  const sourceRef = `${PREFIX}${params}`;
  if (sourceRef.length > MAX_SOURCE_REF) throw new Error('strategy source_ref is too long');
  const parsed = parseXmindStrategySourceRef(sourceRef);
  if (!parsed) throw new Error('strategy context failed validation');
  return sourceRef;
}

