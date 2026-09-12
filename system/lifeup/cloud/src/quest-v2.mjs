import { randomUUID } from 'node:crypto';
import { parseXmindStrategySourceRef } from './strategy-bridge.mjs';
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
    return {
      event_id: randomUUID(),
      event_type: 'quest.revealed',
      actor: requireString(context.actor ?? 'chatgpt', 'actor', 80),
      source: requireString(context.source ?? 'system-api', 'source', 80),
      source_ref: context.sourceRef == null ? null : requireString(context.sourceRef, 'source_ref', 500),
      claim_status: 'derived',
      payload: {
        quest_id: requireString(payload.quest_id, 'payload.quest_id', 100),
        reason: payload.reason == null ? '' : String(payload.reason).trim().slice(0, 500)
      }
    };
  }

  if (type === 'quest.fail') {
    return {
      event_id: randomUUID(),
      event_type: 'quest.failed',
      actor: requireString(context.actor ?? 'chatgpt', 'actor', 80),
      source: requireString(context.source ?? 'system-api', 'source', 80),
      source_ref: context.sourceRef == null ? null : requireString(context.sourceRef, 'source_ref', 500),
      claim_status: 'derived',
      payload: {
        quest_id: requireString(payload.quest_id, 'payload.quest_id', 100),
        reason: payload.reason == null ? '' : String(payload.reason).trim().slice(0, 500)
      }
    };
  }

  if (type === 'quest.expire') {
    return {
      event_id: randomUUID(),
      event_type: 'quest.expired',
      actor: requireString(context.actor ?? 'chatgpt', 'actor', 80),
      source: requireString(context.source ?? 'system-api', 'source', 80),
      source_ref: context.sourceRef == null ? null : requireString(context.sourceRef, 'source_ref', 500),
      claim_status: 'derived',
      payload: {
        quest_id: requireString(payload.quest_id, 'payload.quest_id', 100),
        reason: payload.reason == null ? '' : String(payload.reason).trim().slice(0, 500)
      }
    };
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
    quest.strategy_context = v2 ? parseXmindStrategySourceRef(event.source_ref) : null;
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

export function buildSnapshot(events) {
  return events.reduce(reduceEvent, emptyStateV1());
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

  if (event.event_type === 'quest.created') {
    validateEventAgainstHistoryV1(event, events);
    if (event.payload.quest_version === 2 && state.quests.some((quest) => quest.quest_version === 2 && quest.status === 'ACTIVE')) {
      throw new Error('another active player quest already exists');
    }
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
    if (event.payload.value <= objective.progress) throw new Error('progress must strictly increase');
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
