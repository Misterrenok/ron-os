import { randomUUID } from 'node:crypto';
import { parseXmindStrategySourceRef } from './strategy-bridge.mjs';
import { deriveLatestSoftTargets } from './soft-target.mjs';
import {
  CHALLENGE_POLICY_REF,
  deriveChallengeContracts,
  normalizeChallengeContract
} from './challenge-contract.mjs';
import {
  ATTRIBUTES,
  QUEST_CLASSES,
  QUEST_RANKS,
  ECONOMY_STATUSES,
  NOTIFICATION_SEVERITIES,
  NOTIFICATION_KINDS,
  emptyState as emptyStateV1,
  actionToEvent as actionToEventV1,
  reduceEvent as reduceEventV1,
  validateEventAgainstHistory as validateEventAgainstHistoryV1
} from './model.mjs';

export {
  ATTRIBUTES,
  QUEST_CLASSES,
  QUEST_RANKS,
  ECONOMY_STATUSES,
  NOTIFICATION_SEVERITIES,
  NOTIFICATION_KINDS
};

export const QUEST_VISIBILITIES = ['VISIBLE', 'HIDDEN'];
export const QUEST_TERMINAL_STATUSES = ['COMPLETED', 'CANCELLED', 'FAILED', 'EXPIRED'];
export const QUEST_FOCUS_STATES = ['FOCUSED', 'BACKGROUND', 'NONE'];

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function requireString(value, field, max = 240) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field} is required`);
  const normalized = value.trim();
  if (normalized.length > max) throw new Error(`${field} is too long`);
  return normalized;
}

function requireEnum(value, allowed, field) {
  if (!allowed.includes(value)) throw new Error(`${field} must be one of: ${allowed.join(', ')}`);
  return value;
}

function requireInteger(value, field, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) {
    throw new Error(`${field} must be an integer between ${min} and ${max}`);
  }
  return number;
}

function normalizeEvidence(evidence) {
  const input = evidence && typeof evidence === 'object' ? evidence : {};
  const status = requireEnum(input.status ?? 'reported', ['reported', 'verified'], 'evidence.status');
  const source = requireString(input.source ?? 'ron', 'evidence.source', 80);
  const ref = input.ref == null ? null : requireString(input.ref, 'evidence.ref', 500);
  return { status, source, ref };
}

function normalizeDeadline(value) {
  if (value == null) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new Error('payload.deadline_at must be a valid timestamp or null');
  return parsed.toISOString();
}

function normalizeObjectives(value) {
  if (value == null) return [];
  if (!Array.isArray(value)) throw new Error('payload.objectives must be an array');
  if (value.length > 32) throw new Error('payload.objectives supports at most 32 objectives');
  const seen = new Set();
  return value.map((objective, index) => {
    if (!objective || typeof objective !== 'object' || Array.isArray(objective)) {
      throw new Error(`payload.objectives[${index}] must be an object`);
    }
    const objectiveId = objective.objective_id
      ? requireString(objective.objective_id, `payload.objectives[${index}].objective_id`, 100)
      : randomUUID();
    if (seen.has(objectiveId)) throw new Error('objective_id must be unique within a quest');
    seen.add(objectiveId);
    const title = requireString(objective.title, `payload.objectives[${index}].title`, 180);
    const target = requireInteger(objective.target ?? 1, `payload.objectives[${index}].target`, { min: 1, max: 1_000_000_000 });
    const unit = requireString(objective.unit ?? 'count', `payload.objectives[${index}].unit`, 40);
    const required = hasOwn(objective, 'required')
      ? (() => {
          if (typeof objective.required !== 'boolean') throw new Error(`payload.objectives[${index}].required must be boolean`);
          return objective.required;
        })()
      : true;
    return { objective_id: objectiveId, title, target, unit, required };
  });
}

function isQuestV2Create(payload) {
  return payload.quest_version === 2
    || hasOwn(payload, 'objectives')
    || hasOwn(payload, 'deadline_at')
    || hasOwn(payload, 'visibility');
}

function baseQuestCreatePayload(payload) {
  return {
    ...(hasOwn(payload, 'quest_id') ? { quest_id: payload.quest_id } : {}),
    title: payload.title,
    ...(hasOwn(payload, 'description') ? { description: payload.description } : {}),
    ...(hasOwn(payload, 'class') ? { class: payload.class } : {}),
    ...(hasOwn(payload, 'rank') ? { rank: payload.rank } : {}),
    ...(hasOwn(payload, 'reward_xp') ? { reward_xp: payload.reward_xp } : {}),
    ...(hasOwn(payload, 'reward_coins') ? { reward_coins: payload.reward_coins } : {})
  };
}

function derivedQuestEvent(type, payload, context) {
  return {
    event_id: randomUUID(),
    event_type: type,
    actor: requireString(context.actor ?? 'chatgpt', 'actor', 80),
    source: requireString(context.source ?? 'system-api', 'source', 80),
    source_ref: context.sourceRef == null ? null : requireString(context.sourceRef, 'source_ref', 500),
    claim_status: 'derived',
    payload
  };
}

export function actionToEvent(action, context = {}) {
  if (!action || typeof action !== 'object') throw new Error('action body must be an object');
  const type = requireString(action.type, 'type', 80);
  const payload = action.payload && typeof action.payload === 'object' && !Array.isArray(action.payload) ? action.payload : {};

  if (type === 'quest.create' && isQuestV2Create(payload)) {
    if (hasOwn(payload, 'quest_version') && payload.quest_version !== 2) {
      throw new Error('payload.quest_version must be 2 for Quest v2');
    }
    const event = actionToEventV1({ type, payload: baseQuestCreatePayload(payload) }, context);
    const visibility = requireEnum(
      payload.visibility ?? (event.payload.class === 'HIDDEN' ? 'HIDDEN' : 'VISIBLE'),
      QUEST_VISIBILITIES,
      'payload.visibility'
    );
    event.payload = {
      ...event.payload,
      quest_version: 2,
      objectives: normalizeObjectives(payload.objectives),
      deadline_at: normalizeDeadline(payload.deadline_at),
      visibility
    };
    return event;
  }

  if (type === 'challenge.declare') {
    const contract = normalizeChallengeContract(payload);
    const questId = requireString(payload.quest_id, 'payload.quest_id', 100);
    const deadlineAt = normalizeDeadline(payload.deadline_at);
    if (!deadlineAt) throw new Error('Challenge declaration requires deadline_at');
    if (payload.policy_ref !== CHALLENGE_POLICY_REF) throw new Error('Challenge declaration policy_ref is invalid');
    if (payload.recovery_quest_id !== contract.recovery_quest_id) throw new Error('Challenge recovery_quest_id is invalid');
    if (payload.recovery_objective_id !== contract.recovery_objective_id) throw new Error('Challenge recovery_objective_id is invalid');
    return derivedQuestEvent('challenge.declared', {
      policy_ref: CHALLENGE_POLICY_REF,
      contract_id: contract.contract_id,
      quest_id: questId,
      deadline_at: deadlineAt,
      recovery_quest_id: contract.recovery_quest_id,
      recovery_objective_id: contract.recovery_objective_id,
      recovery_title: contract.recovery_title,
      recovery_objective: contract.recovery_objective,
      recovery_target: contract.recovery_target,
      recovery_unit: contract.recovery_unit
    }, context);
  }

  if (type === 'quest.focus') {
    return derivedQuestEvent('quest.focused', {
      quest_id: requireString(payload.quest_id, 'payload.quest_id', 100),
      reason: payload.reason == null ? '' : String(payload.reason).trim().slice(0, 500)
    }, context);
  }

  if (type === 'quest.progress') {
    const evidence = normalizeEvidence(payload.evidence);
    return {
      event_id: randomUUID(),
      event_type: 'quest.progressed',
      actor: requireString(context.actor ?? 'chatgpt', 'actor', 80),
      source: requireString(context.source ?? 'system-api', 'source', 80),
      source_ref: context.sourceRef == null ? null : requireString(context.sourceRef, 'source_ref', 500),
      claim_status: evidence.status,
      payload: {
        quest_id: requireString(payload.quest_id, 'payload.quest_id', 100),
        objective_id: requireString(payload.objective_id, 'payload.objective_id', 100),
        value: requireInteger(payload.value, 'payload.value', { min: 0, max: 1_000_000_000 }),
        evidence
      }
    };
  }

  if (type === 'quest.reveal') {
    return derivedQuestEvent('quest.revealed', {
      quest_id: requireString(payload.quest_id, 'payload.quest_id', 100),
      reason: payload.reason == null ? '' : String(payload.reason).trim().slice(0, 500)
    }, context);
  }

  if (type === 'quest.fail') {
    return derivedQuestEvent('quest.failed', {
      quest_id: requireString(payload.quest_id, 'payload.quest_id', 100),
      reason: payload.reason == null ? '' : String(payload.reason).trim().slice(0, 500)
    }, context);
  }

  if (type === 'quest.expire') {
    return derivedQuestEvent('quest.expired', {
      quest_id: requireString(payload.quest_id, 'payload.quest_id', 100),
      reason: payload.reason == null ? '' : String(payload.reason).trim().slice(0, 500)
    }, context);
  }

  return actionToEventV1(action, context);
}

function findQuest(state, questId) {
  return state.quests.find((quest) => quest.id === questId);
}

export function reduceEvent(state, event) {
  const next = reduceEventV1(state, event);
  const questId = event.payload?.quest_id;
  const quest = questId ? findQuest(next, questId) : null;

  if (event.event_type === 'quest.created' && quest) {
    const v2 = event.payload.quest_version === 2;
    quest.quest_version = v2 ? 2 : 1;
    quest.objectives = v2
      ? (event.payload.objectives ?? []).map((objective) => ({
          ...objective,
          progress: 0,
          progress_claim: null,
          progress_event_id: null
        }))
      : [];
    quest.deadline_at = v2 ? (event.payload.deadline_at ?? null) : null;
    quest.visibility = v2 ? (event.payload.visibility ?? 'VISIBLE') : 'VISIBLE';
    quest.revealed = quest.visibility !== 'HIDDEN';
    quest.reveal_event_id = null;
    quest.strategy_context = v2 ? parseXmindStrategySourceRef(event.source_ref, { at: event.occurred_at }) : null;
  }

  if (event.event_type === 'quest.progressed' && quest && quest.status === 'ACTIVE') {
    const objective = quest.objectives?.find((item) => item.objective_id === event.payload.objective_id);
    if (objective) {
      objective.progress = event.payload.value;
      objective.progress_claim = event.claim_status === 'verified' ? 'VERIFIED' : 'REPORTED';
      objective.progress_event_id = event.event_id;
    }
  }

  if (event.event_type === 'quest.revealed' && quest && quest.visibility === 'HIDDEN' && !quest.revealed) {
    quest.revealed = true;
    quest.reveal_event_id = event.event_id;
    quest.reveal_reason = event.payload.reason;
  }

  if (event.event_type === 'quest.failed' && quest && quest.status === 'ACTIVE') {
    quest.status = 'FAILED';
    quest.failure_reason = event.payload.reason;
    quest.failed_event_id = event.event_id;
  }

  if (event.event_type === 'quest.expired' && quest && quest.status === 'ACTIVE') {
    quest.status = 'EXPIRED';
    quest.expiry_reason = event.payload.reason;
    quest.expired_event_id = event.event_id;
  }

  return next;
}

function applyFocusProjection(state, events) {
  const openV2 = state.quests.filter((quest) => quest.quest_version === 2 && quest.status === 'ACTIVE');
  const focusEvents = events.filter((event) => event.event_type === 'quest.focused');
  let focusedQuestId = null;
  let focusSource = null;

  if (focusEvents.length) {
    const latest = focusEvents.at(-1);
    const target = openV2.find((quest) => quest.id === latest.payload?.quest_id);
    if (target) {
      focusedQuestId = target.id;
      focusSource = 'EXPLICIT';
    }
  } else if (openV2.length) {
    const openIds = new Set(openV2.map((quest) => quest.id));
    const legacyCreated = events.find((event) => (
      event.event_type === 'quest.created'
      && event.payload?.quest_version === 2
      && openIds.has(event.payload?.quest_id)
    ));
    if (legacyCreated) {
      focusedQuestId = legacyCreated.payload.quest_id;
      focusSource = 'LEGACY_IMPLICIT';
    }
  }

  for (const quest of state.quests) {
    if (quest.quest_version !== 2 || quest.status !== 'ACTIVE') {
      quest.focus_state = 'NONE';
      quest.focused = false;
      continue;
    }
    quest.focused = quest.id === focusedQuestId;
    quest.focus_state = quest.focused ? 'FOCUSED' : 'BACKGROUND';
  }

  state.focused_quest_id = focusedQuestId;
  state.focus_source = focusSource;
  state.focus_required = openV2.length > 0 && !focusedQuestId;
  state.open_quest_count = openV2.length;
}

export function buildSnapshot(events) {
  const state = events.reduce(reduceEvent, emptyStateV1());
  const softTargets = deriveLatestSoftTargets(events);
  const challenges = deriveChallengeContracts(events);
  for (const quest of state.quests) {
    if (quest.quest_version !== 2) continue;
    quest.timing_mode = quest.deadline_at ? 'HARD_EXTERNAL' : 'NONE';
    quest.challenge_contract = null;
    const challenge = challenges.byQuest.get(quest.id);
    if (challenge && quest.deadline_at && new Date(challenge.deadline_at).getTime() === new Date(quest.deadline_at).getTime()) {
      quest.timing_mode = 'CHALLENGE';
      quest.challenge_contract = challenge;
    }
    if (quest.status !== 'ACTIVE') continue;
    const target = softTargets.get(quest.id);
    if (!target) continue;
    if (quest.deadline_at && new Date(target.target_at).getTime() > new Date(quest.deadline_at).getTime()) continue;
    quest.soft_target_at = target.target_at;
    quest.soft_target_reason = target.reason || null;
    quest.soft_target_policy_ref = target.policy_ref;
  }
  applyFocusProjection(state, events);
  return state;
}

function requireActiveQuest(state, questId) {
  const quest = findQuest(state, questId);
  if (!quest) throw new Error('quest does not exist');
  if (quest.status !== 'ACTIVE') throw new Error(`quest is not active: ${quest.status}`);
  return quest;
}

function requiredObjectivesComplete(quest) {
  return (quest.objectives ?? [])
    .filter((objective) => objective.required)
    .every((objective) => Number(objective.progress ?? 0) >= Number(objective.target));
}

export function validateEventAgainstHistory(event, events) {
  const state = buildSnapshot(events);

  if (event.event_type === 'challenge.declared') {
    if (state.quests.some((quest) => quest.id === event.payload.quest_id)) {
      throw new Error('Challenge v1 cannot retrofit an already-created quest');
    }
    if (events.some((prior) => prior.event_type === 'challenge.declared' && prior.payload?.contract_id === event.payload.contract_id)) {
      throw new Error('challenge contract_id already exists');
    }
    if (events.some((prior) => prior.event_type === 'challenge.declared' && prior.payload?.quest_id === event.payload.quest_id)) {
      throw new Error('quest already has a Challenge contract');
    }
    return;
  }

  if (event.event_type === 'quest.created') {
    validateEventAgainstHistoryV1(event, events);
    return;
  }

  if (event.event_type === 'quest.focused') {
    const quest = requireActiveQuest(state, event.payload.quest_id);
    if (quest.quest_version !== 2) throw new Error('quest.focus requires a Quest v2 quest');
    if (state.focused_quest_id === quest.id) throw new Error('quest is already focused');
    return;
  }

  if (event.event_type === 'quest.completed') {
    const quest = requireActiveQuest(state, event.payload.quest_id);
    if (quest.quest_version === 2 && !requiredObjectivesComplete(quest)) {
      throw new Error('required objectives are incomplete');
    }
    validateEventAgainstHistoryV1(event, events);
    return;
  }

  if (event.event_type === 'quest.cancelled') {
    requireActiveQuest(state, event.payload.quest_id);
    validateEventAgainstHistoryV1(event, events);
    return;
  }

  if (event.event_type === 'quest.progressed') {
    const quest = requireActiveQuest(state, event.payload.quest_id);
    if (quest.quest_version !== 2) throw new Error('quest.progress requires a Quest v2 quest');
    const objective = quest.objectives.find((item) => item.objective_id === event.payload.objective_id);
    if (!objective) throw new Error('objective does not exist');
    if (event.payload.value < objective.progress) throw new Error('progress must strictly increase unless verifying reported progress');
    if (event.payload.value === objective.progress) {
      const verificationUpgrade = objective.progress_claim === 'REPORTED' && event.claim_status === 'verified';
      if (!verificationUpgrade) throw new Error('progress must strictly increase unless verifying reported progress');
    }
    if (event.payload.value > objective.target) throw new Error('progress cannot exceed objective target');
    if (!['reported', 'verified'].includes(event.claim_status)) throw new Error('progress claim must be reported or verified');
    return;
  }

  if (event.event_type === 'quest.revealed') {
    const quest = findQuest(state, event.payload.quest_id);
    if (!quest) throw new Error('quest does not exist');
    if (quest.quest_version !== 2) throw new Error('quest.reveal requires a Quest v2 quest');
    if (quest.visibility !== 'HIDDEN') throw new Error('quest is not hidden');
    if (quest.revealed) throw new Error('quest is already revealed');
    return;
  }

  if (event.event_type === 'quest.failed') {
    const quest = requireActiveQuest(state, event.payload.quest_id);
    if (quest.quest_version !== 2) throw new Error('quest.fail requires a Quest v2 quest');
    return;
  }

  if (event.event_type === 'quest.expired') {
    const quest = requireActiveQuest(state, event.payload.quest_id);
    if (quest.quest_version !== 2) throw new Error('quest.expire requires a Quest v2 quest');
    if (!quest.deadline_at) throw new Error('quest has no deadline');
    if (Date.now() < new Date(quest.deadline_at).getTime()) throw new Error('quest deadline has not passed');
    return;
  }

  validateEventAgainstHistoryV1(event, events);
}
