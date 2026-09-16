export const CHALLENGE_POLICY_REF = 'system-challenge-contract:v1';
export const CHALLENGE_EVENT_TYPE = 'challenge.declared';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i;

function requireText(value, field, max) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field} is required`);
  const normalized = value.trim();
  if (normalized.length > max) throw new Error(`${field} is too long`);
  return normalized;
}

function requirePositiveInteger(value, field, fallback = 1) {
  const parsed = value == null ? fallback : Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 1_000_000_000) {
    throw new Error(`${field} must be an integer between 1 and 1000000000`);
  }
  return parsed;
}

export function normalizeContractId(value) {
  const id = requireText(value, 'contract.contract_id', 36).toLowerCase();
  if (!UUID_RE.test(id)) throw new Error('contract.contract_id must be a UUID');
  return id;
}

export function recoveryQuestId(contractId) {
  return `challenge-recovery:${normalizeContractId(contractId)}`;
}

export function recoveryObjectiveId(contractId) {
  return `challenge-recovery-objective:${normalizeContractId(contractId)}`;
}

export function challengeInternalKey(kind, contractId) {
  const normalizedKind = requireText(kind, 'challenge internal key kind', 32).toLowerCase().replace(/[^a-z0-9-]/g, '-');
  return `${CHALLENGE_POLICY_REF}:${normalizedKind}:${normalizeContractId(contractId)}`;
}

export function normalizeChallengeContract(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('contract must be an object');
  const contractId = normalizeContractId(input.contract_id);
  return {
    contract_id: contractId,
    recovery_quest_id: recoveryQuestId(contractId),
    recovery_objective_id: recoveryObjectiveId(contractId),
    recovery_title: requireText(input.recovery_title, 'contract.recovery_title', 180),
    recovery_objective: requireText(input.recovery_objective, 'contract.recovery_objective', 180),
    recovery_target: requirePositiveInteger(input.recovery_target, 'contract.recovery_target', 1),
    recovery_unit: requireText(input.recovery_unit ?? 'count', 'contract.recovery_unit', 40)
  };
}

export function normalizeChallengeCreate(action, { now = Date.now() } = {}) {
  if (!action || typeof action !== 'object' || action.type !== 'challenge.create') {
    throw new Error('challenge.create action is required');
  }
  const payload = action.payload;
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('payload must be an object');
  const questInput = payload.quest;
  if (!questInput || typeof questInput !== 'object' || Array.isArray(questInput)) throw new Error('payload.quest must be an object');
  if (questInput.quest_version !== 2) throw new Error('Challenge requires Quest v2');
  const questId = requireText(questInput.quest_id, 'payload.quest.quest_id', 100);
  const title = requireText(questInput.title, 'payload.quest.title', 180);
  if (questInput.visibility === 'HIDDEN' || questInput.class === 'HIDDEN') {
    throw new Error('Challenge must be player-visible');
  }
  const deadline = new Date(questInput.deadline_at);
  if (Number.isNaN(deadline.getTime())) throw new Error('Challenge requires a valid deadline_at');
  const nowMs = now instanceof Date ? now.getTime() : Number(now);
  if (!Number.isFinite(nowMs)) throw new Error('now must be a valid timestamp');
  if (deadline.getTime() <= nowMs) throw new Error('Challenge deadline_at must be in the future');
  const contract = normalizeChallengeContract(payload.contract);
  const quest = {
    ...questInput,
    quest_id: questId,
    quest_version: 2,
    title,
    deadline_at: deadline.toISOString(),
    visibility: questInput.visibility ?? 'VISIBLE'
  };
  delete quest.timing_mode;
  delete quest.challenge_contract;
  return { quest, contract };
}

export function challengeDeclarationAction({ quest, contract }) {
  return {
    type: 'challenge.declare',
    payload: {
      policy_ref: CHALLENGE_POLICY_REF,
      contract_id: contract.contract_id,
      quest_id: quest.quest_id,
      deadline_at: quest.deadline_at,
      recovery_quest_id: contract.recovery_quest_id,
      recovery_objective_id: contract.recovery_objective_id,
      recovery_title: contract.recovery_title,
      recovery_objective: contract.recovery_objective,
      recovery_target: contract.recovery_target,
      recovery_unit: contract.recovery_unit
    }
  };
}

export function challengeQuestAction({ quest }) {
  return { type: 'quest.create', payload: { ...quest } };
}

export function challengeRecoveryQuestAction(contractPayload, parentQuest = null) {
  const contract = normalizeChallengeContract({
    contract_id: contractPayload.contract_id,
    recovery_title: contractPayload.recovery_title,
    recovery_objective: contractPayload.recovery_objective,
    recovery_target: contractPayload.recovery_target,
    recovery_unit: contractPayload.recovery_unit
  });
  const parent = parentQuest?.title ? ` после испытания «${String(parentQuest.title).slice(0, 120)}»` : '';
  return {
    type: 'quest.create',
    payload: {
      quest_id: contract.recovery_quest_id,
      quest_version: 2,
      title: contract.recovery_title,
      description: `Восстановительное действие${parent}. Верни траекторию без потери уже заработанного прогресса.`,
      class: 'RECOVERY',
      rank: 'E',
      reward_xp: null,
      reward_coins: null,
      objectives: [{
        objective_id: contract.recovery_objective_id,
        title: contract.recovery_objective,
        target: contract.recovery_target,
        unit: contract.recovery_unit,
        required: true
      }],
      deadline_at: null,
      visibility: 'VISIBLE'
    }
  };
}

export function deriveChallengeContracts(events = []) {
  const byQuest = new Map();
  const byContract = new Map();
  for (const event of events) {
    if (event?.event_type !== CHALLENGE_EVENT_TYPE) continue;
    const payload = event.payload;
    if (!payload || typeof payload !== 'object') continue;
    try {
      const contract = normalizeChallengeContract(payload);
      const deadline = new Date(payload.deadline_at);
      const questId = requireText(payload.quest_id, 'challenge.quest_id', 100);
      if (Number.isNaN(deadline.getTime())) continue;
      const projected = {
        policy_ref: CHALLENGE_POLICY_REF,
        ...contract,
        quest_id: questId,
        deadline_at: deadline.toISOString(),
        declaration_event_id: event.event_id ?? null,
        declaration_seq: Number(event.seq ?? 0)
      };
      const prior = byQuest.get(questId);
      if (!prior || projected.declaration_seq >= prior.declaration_seq) byQuest.set(questId, projected);
      byContract.set(contract.contract_id, projected);
    } catch {
      // Historical/invalid events fail closed and never become an active Challenge projection.
    }
  }
  return { byQuest, byContract };
}
