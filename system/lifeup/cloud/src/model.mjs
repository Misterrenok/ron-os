import { randomUUID } from 'node:crypto';

export const ATTRIBUTES = ['STR', 'VIT', 'INT', 'DISC', 'CHA'];
export const QUEST_CLASSES = ['DAILY', 'SIDE', 'MAIN', 'RECOVERY', 'HIDDEN'];
export const QUEST_RANKS = ['E', 'D', 'C', 'B', 'A', 'S'];
const CLAIM_STATUSES = new Set(['none', 'reported', 'verified', 'derived']);

export function emptyState() {
  return {
    profile: {
      initialized: false,
      level: null,
      rank: null,
      xp: 0,
      xp_to_next: null,
      coins: 0,
      economy_status: 'UNCALIBRATED'
    },
    attributes: Object.fromEntries(ATTRIBUTES.map((name) => [name, null])),
    skills: [],
    quests: [],
    achievements: [],
    shop: [],
    notifications: [],
    log: []
  };
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

function normalizeEvidence(evidence, { verifiedRequired = false } = {}) {
  if (!evidence || typeof evidence !== 'object') {
    if (verifiedRequired) throw new Error('verified evidence is required');
    return { status: 'reported', source: 'ron', ref: null };
  }
  const status = requireEnum(evidence.status ?? 'reported', ['reported', 'verified'], 'evidence.status');
  if (verifiedRequired && status !== 'verified') throw new Error('verified evidence is required');
  return {
    status,
    source: requireString(evidence.source ?? 'ron', 'evidence.source', 80),
    ref: evidence.ref == null ? null : requireString(evidence.ref, 'evidence.ref', 500)
  };
}

export function actionToEvent(action, context = {}) {
  if (!action || typeof action !== 'object') throw new Error('action body must be an object');
  const type = requireString(action.type, 'type', 80);
  const payload = action.payload && typeof action.payload === 'object' ? action.payload : {};
  const actor = requireString(context.actor ?? 'chatgpt', 'actor', 80);
  const source = requireString(context.source ?? 'system-api', 'source', 80);
  const sourceRef = context.sourceRef == null ? null : requireString(context.sourceRef, 'source_ref', 500);
  let eventType;
  let eventPayload;
  let claimStatus = 'none';

  switch (type) {
    case 'quest.create': {
      eventType = 'quest.created';
      eventPayload = {
        quest_id: payload.quest_id ? requireString(payload.quest_id, 'payload.quest_id', 100) : randomUUID(),
        title: requireString(payload.title, 'payload.title', 180),
        description: payload.description == null ? '' : String(payload.description).trim().slice(0, 2000),
        class: requireEnum(payload.class ?? 'SIDE', QUEST_CLASSES, 'payload.class'),
        rank: requireEnum(payload.rank ?? 'E', QUEST_RANKS, 'payload.rank'),
        reward_xp: payload.reward_xp == null ? null : Number(payload.reward_xp),
        reward_coins: payload.reward_coins == null ? null : Number(payload.reward_coins)
      };
      if (eventPayload.reward_xp != null && (!Number.isInteger(eventPayload.reward_xp) || eventPayload.reward_xp < 0)) {
        throw new Error('payload.reward_xp must be a non-negative integer or null');
      }
      if (eventPayload.reward_coins != null && (!Number.isInteger(eventPayload.reward_coins) || eventPayload.reward_coins < 0)) {
        throw new Error('payload.reward_coins must be a non-negative integer or null');
      }
      claimStatus = 'derived';
      break;
    }
    case 'quest.complete': {
      eventType = 'quest.completed';
      const evidence = normalizeEvidence(payload.evidence);
      eventPayload = {
        quest_id: requireString(payload.quest_id, 'payload.quest_id', 100),
        evidence
      };
      claimStatus = evidence.status;
      break;
    }
    case 'quest.cancel': {
      eventType = 'quest.cancelled';
      eventPayload = {
        quest_id: requireString(payload.quest_id, 'payload.quest_id', 100),
        reason: payload.reason == null ? '' : String(payload.reason).trim().slice(0, 500)
      };
      claimStatus = 'derived';
      break;
    }
    case 'progression.award': {
      eventType = 'progression.awarded';
      const evidence = normalizeEvidence(payload.evidence, { verifiedRequired: true });
      const xp = payload.xp == null ? 0 : Number(payload.xp);
      const coins = payload.coins == null ? 0 : Number(payload.coins);
      if (!Number.isInteger(xp) || xp < 0) throw new Error('payload.xp must be a non-negative integer');
      if (!Number.isInteger(coins) || coins < 0) throw new Error('payload.coins must be a non-negative integer');
      if (xp === 0 && coins === 0) throw new Error('progression.award requires xp or coins');
      eventPayload = {
        xp,
        coins,
        basis_event_id: requireString(payload.basis_event_id, 'payload.basis_event_id', 100),
        evidence
      };
      claimStatus = 'verified';
      break;
    }
    default:
      throw new Error(`unsupported action type: ${type}`);
  }

  if (!CLAIM_STATUSES.has(claimStatus)) throw new Error('invalid claim status');
  return {
    event_id: randomUUID(),
    event_type: eventType,
    actor,
    source,
    source_ref: sourceRef,
    claim_status: claimStatus,
    payload: eventPayload
  };
}

function findQuest(state, questId) {
  return state.quests.find((quest) => quest.id === questId);
}

export function reduceEvent(state, event) {
  const next = structuredClone(state);
  switch (event.event_type) {
    case 'quest.created': {
      if (findQuest(next, event.payload.quest_id)) break;
      next.quests.unshift({
        id: event.payload.quest_id,
        title: event.payload.title,
        description: event.payload.description,
        class: event.payload.class,
        rank: event.payload.rank,
        reward_xp: event.payload.reward_xp,
        reward_coins: event.payload.reward_coins,
        status: 'ACTIVE',
        completion_claim: null,
        created_event_id: event.event_id
      });
      break;
    }
    case 'quest.completed': {
      const quest = findQuest(next, event.payload.quest_id);
      if (quest && quest.status === 'ACTIVE') {
        quest.status = 'COMPLETED';
        quest.completion_claim = event.claim_status === 'verified' ? 'VERIFIED' : 'REPORTED';
        quest.completed_event_id = event.event_id;
      }
      break;
    }
    case 'quest.cancelled': {
      const quest = findQuest(next, event.payload.quest_id);
      if (quest && quest.status === 'ACTIVE') {
        quest.status = 'CANCELLED';
        quest.cancel_reason = event.payload.reason;
      }
      break;
    }
    case 'progression.awarded': {
      if (event.claim_status !== 'verified') break;
      next.profile.xp += event.payload.xp;
      next.profile.coins += event.payload.coins;
      break;
    }
    default:
      break;
  }

  next.log.unshift({
    event_id: event.event_id,
    type: event.event_type,
    occurred_at: event.occurred_at,
    claim_status: event.claim_status,
    source: event.source
  });
  next.log = next.log.slice(0, 100);
  return next;
}

export function validateEventAgainstHistory(event, events) {
  const state = buildSnapshot(events);
  if (event.event_type === 'quest.created') {
    if (state.quests.some((quest) => quest.id === event.payload.quest_id)) throw new Error('quest_id already exists');
    return;
  }
  if (event.event_type === 'quest.completed' || event.event_type === 'quest.cancelled') {
    const quest = state.quests.find((item) => item.id === event.payload.quest_id);
    if (!quest) throw new Error('quest does not exist');
    if (quest.status !== 'ACTIVE') throw new Error(`quest is not active: ${quest.status}`);
    return;
  }
  if (event.event_type === 'progression.awarded') {
    const basis = events.find((item) => item.event_id === event.payload.basis_event_id);
    if (!basis) throw new Error('basis_event_id does not exist');
    if (basis.event_type !== 'quest.completed') throw new Error('progression basis must be a quest.completed event');
    if (basis.claim_status !== 'verified') throw new Error('progression basis must be verified');
    const priorAward = events.find((item) => item.event_type === 'progression.awarded' && item.payload?.basis_event_id === basis.event_id);
    if (priorAward) throw new Error('progression already awarded for basis event');
  }
}

export function buildSnapshot(events) {
  return events.reduce(reduceEvent, emptyState());
}
