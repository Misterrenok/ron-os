import { randomUUID } from 'node:crypto';

export const ATTRIBUTES = ['STR', 'VIT', 'INT', 'DISC', 'CHA'];
export const QUEST_CLASSES = ['DAILY', 'SIDE', 'MAIN', 'RECOVERY', 'HIDDEN'];
export const QUEST_RANKS = ['E', 'D', 'C', 'B', 'A', 'S'];
export const ECONOMY_STATUSES = ['UNCALIBRATED', 'CALIBRATED'];
export const NOTIFICATION_SEVERITIES = ['INFO', 'SUCCESS', 'WARNING', 'CRITICAL'];
export const NOTIFICATION_KINDS = ['SYSTEM', 'QUEST', 'REWARD', 'ACHIEVEMENT'];
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
      economy_status: 'UNCALIBRATED',
      calibration_claim: null,
      calibration_event_id: null
    },
    attributes: Object.fromEntries(ATTRIBUTES.map((name) => [name, null])),
    attribute_meta: Object.fromEntries(ATTRIBUTES.map((name) => [name, null])),
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

function requireBoolean(value, field) {
  if (typeof value !== 'boolean') throw new Error(`${field} must be boolean`);
  return value;
}

function nullableInteger(value, field, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  if (value == null) return null;
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) throw new Error(`${field} must be an integer between ${min} and ${max}, or null`);
  return number;
}

function normalizeEvidence(evidence, { verifiedRequired = false, refRequired = false } = {}) {
  if (!evidence || typeof evidence !== 'object') {
    if (verifiedRequired) throw new Error('verified evidence is required');
    return { status: 'reported', source: 'ron', ref: null };
  }
  const status = requireEnum(evidence.status ?? 'reported', ['reported', 'verified'], 'evidence.status');
  if (verifiedRequired && status !== 'verified') throw new Error('verified evidence is required');
  const ref = evidence.ref == null ? null : requireString(evidence.ref, 'evidence.ref', 500);
  if (refRequired && !ref) throw new Error('evidence.ref is required for calibration');
  return {
    status,
    source: requireString(evidence.source ?? 'ron', 'evidence.source', 80),
    ref
  };
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
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
        reward_xp: nullableInteger(payload.reward_xp, 'payload.reward_xp'),
        reward_coins: nullableInteger(payload.reward_coins, 'payload.reward_coins')
      };
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
    case 'profile.calibrate': {
      eventType = 'profile.calibrated';
      const evidence = normalizeEvidence(payload.evidence, { verifiedRequired: true, refRequired: true });
      const allowed = ['level', 'rank', 'xp_to_next', 'economy_status'];
      if (!allowed.some((field) => hasOwn(payload, field))) throw new Error('profile.calibrate requires at least one calibration field');
      eventPayload = { evidence };
      if (hasOwn(payload, 'level')) eventPayload.level = nullableInteger(payload.level, 'payload.level', { min: 1, max: 9999 });
      if (hasOwn(payload, 'rank')) eventPayload.rank = payload.rank == null ? null : requireEnum(payload.rank, QUEST_RANKS, 'payload.rank');
      if (hasOwn(payload, 'xp_to_next')) eventPayload.xp_to_next = nullableInteger(payload.xp_to_next, 'payload.xp_to_next', { min: 1 });
      if (hasOwn(payload, 'economy_status')) eventPayload.economy_status = requireEnum(payload.economy_status, ECONOMY_STATUSES, 'payload.economy_status');
      claimStatus = 'verified';
      break;
    }
    case 'attribute.set': {
      eventType = 'attribute.set';
      const evidence = normalizeEvidence(payload.evidence, { verifiedRequired: true, refRequired: true });
      eventPayload = {
        name: requireEnum(payload.name, ATTRIBUTES, 'payload.name'),
        value: nullableInteger(payload.value, 'payload.value', { min: 0, max: 9999 }),
        scale_ref: requireString(payload.scale_ref, 'payload.scale_ref', 160),
        evidence
      };
      claimStatus = 'verified';
      break;
    }
    case 'skill.upsert': {
      eventType = 'skill.upserted';
      const evidence = normalizeEvidence(payload.evidence, { verifiedRequired: true, refRequired: true });
      const level = hasOwn(payload, 'level') ? nullableInteger(payload.level, 'payload.level', { min: 0, max: 9999 }) : null;
      const scaleRef = payload.scale_ref == null ? null : requireString(payload.scale_ref, 'payload.scale_ref', 160);
      if (level != null && !scaleRef) throw new Error('payload.scale_ref is required when skill level is set');
      eventPayload = {
        skill_id: payload.skill_id ? requireString(payload.skill_id, 'payload.skill_id', 100) : randomUUID(),
        name: requireString(payload.name, 'payload.name', 160),
        domain: requireString(payload.domain, 'payload.domain', 120),
        level,
        scale_ref: scaleRef,
        active: hasOwn(payload, 'active') ? requireBoolean(payload.active, 'payload.active') : true,
        evidence
      };
      claimStatus = 'verified';
      break;
    }
    case 'achievement.unlock': {
      eventType = 'achievement.unlocked';
      const evidence = normalizeEvidence(payload.evidence, { verifiedRequired: true, refRequired: true });
      eventPayload = {
        achievement_id: payload.achievement_id ? requireString(payload.achievement_id, 'payload.achievement_id', 100) : randomUUID(),
        title: requireString(payload.title, 'payload.title', 180),
        description: payload.description == null ? '' : String(payload.description).trim().slice(0, 1200),
        rank: requireEnum(payload.rank ?? 'E', QUEST_RANKS, 'payload.rank'),
        evidence
      };
      claimStatus = 'verified';
      break;
    }
    case 'shop.item.upsert': {
      eventType = 'shop.item.upserted';
      eventPayload = {
        item_id: payload.item_id ? requireString(payload.item_id, 'payload.item_id', 100) : randomUUID(),
        title: requireString(payload.title, 'payload.title', 180),
        description: payload.description == null ? '' : String(payload.description).trim().slice(0, 1200),
        cost_coins: nullableInteger(payload.cost_coins, 'payload.cost_coins', { min: 0 }),
        active: hasOwn(payload, 'active') ? requireBoolean(payload.active, 'payload.active') : true,
        repeatable: hasOwn(payload, 'repeatable') ? requireBoolean(payload.repeatable, 'payload.repeatable') : false
      };
      claimStatus = 'derived';
      break;
    }
    case 'shop.redeem': {
      eventType = 'shop.redeemed';
      eventPayload = {
        item_id: requireString(payload.item_id, 'payload.item_id', 100),
        redemption_id: payload.redemption_id ? requireString(payload.redemption_id, 'payload.redemption_id', 100) : randomUUID(),
        note: payload.note == null ? '' : String(payload.note).trim().slice(0, 500)
      };
      claimStatus = 'derived';
      break;
    }
    case 'notification.push': {
      eventType = 'notification.pushed';
      eventPayload = {
        notification_id: payload.notification_id ? requireString(payload.notification_id, 'payload.notification_id', 100) : randomUUID(),
        title: requireString(payload.title, 'payload.title', 180),
        body: payload.body == null ? '' : String(payload.body).trim().slice(0, 1200),
        severity: requireEnum(payload.severity ?? 'INFO', NOTIFICATION_SEVERITIES, 'payload.severity'),
        kind: requireEnum(payload.kind ?? 'SYSTEM', NOTIFICATION_KINDS, 'payload.kind')
      };
      claimStatus = 'derived';
      break;
    }
    case 'notification.ack': {
      eventType = 'notification.acknowledged';
      eventPayload = {
        notification_id: requireString(payload.notification_id, 'payload.notification_id', 100)
      };
      claimStatus = 'derived';
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

function findSkill(state, skillId) {
  return state.skills.find((skill) => skill.id === skillId);
}

function findShopItem(state, itemId) {
  return state.shop.find((item) => item.id === itemId);
}

function findNotification(state, notificationId) {
  return state.notifications.find((item) => item.id === notificationId);
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
    case 'profile.calibrated': {
      if (event.claim_status !== 'verified') break;
      next.profile.initialized = true;
      for (const field of ['level', 'rank', 'xp_to_next', 'economy_status']) {
        if (hasOwn(event.payload, field)) next.profile[field] = event.payload[field];
      }
      next.profile.calibration_claim = 'VERIFIED';
      next.profile.calibration_event_id = event.event_id;
      break;
    }
    case 'attribute.set': {
      if (event.claim_status !== 'verified' || !ATTRIBUTES.includes(event.payload.name)) break;
      next.attributes[event.payload.name] = event.payload.value;
      next.attribute_meta[event.payload.name] = {
        scale_ref: event.payload.scale_ref,
        claim: 'VERIFIED',
        evidence_ref: event.payload.evidence?.ref ?? null,
        event_id: event.event_id
      };
      break;
    }
    case 'skill.upserted': {
      if (event.claim_status !== 'verified') break;
      const existing = findSkill(next, event.payload.skill_id);
      const record = {
        id: event.payload.skill_id,
        name: event.payload.name,
        domain: event.payload.domain,
        level: event.payload.level,
        scale_ref: event.payload.scale_ref,
        active: event.payload.active,
        claim: 'VERIFIED',
        evidence_ref: event.payload.evidence?.ref ?? null,
        updated_event_id: event.event_id
      };
      if (existing) Object.assign(existing, record);
      else next.skills.unshift(record);
      break;
    }
    case 'achievement.unlocked': {
      if (event.claim_status !== 'verified') break;
      if (next.achievements.some((item) => item.id === event.payload.achievement_id)) break;
      next.achievements.unshift({
        id: event.payload.achievement_id,
        title: event.payload.title,
        description: event.payload.description,
        rank: event.payload.rank,
        claim: 'VERIFIED',
        evidence_ref: event.payload.evidence?.ref ?? null,
        unlocked_at: event.occurred_at,
        event_id: event.event_id
      });
      break;
    }
    case 'shop.item.upserted': {
      const existing = findShopItem(next, event.payload.item_id);
      const previousRedemptions = existing?.redemptions ?? 0;
      const record = {
        id: event.payload.item_id,
        title: event.payload.title,
        description: event.payload.description,
        cost_coins: event.payload.cost_coins,
        active: event.payload.active,
        repeatable: event.payload.repeatable,
        redemptions: previousRedemptions,
        updated_event_id: event.event_id
      };
      if (existing) Object.assign(existing, record);
      else next.shop.unshift(record);
      break;
    }
    case 'shop.redeemed': {
      const item = findShopItem(next, event.payload.item_id);
      if (!item) break;
      const cost = Number(event.payload.cost_coins ?? 0);
      next.profile.coins = Math.max(0, next.profile.coins - cost);
      item.redemptions = (item.redemptions ?? 0) + 1;
      item.last_redemption_id = event.payload.redemption_id;
      item.last_redeemed_at = event.occurred_at;
      break;
    }
    case 'notification.pushed': {
      if (findNotification(next, event.payload.notification_id)) break;
      next.notifications.unshift({
        id: event.payload.notification_id,
        title: event.payload.title,
        body: event.payload.body,
        severity: event.payload.severity,
        kind: event.payload.kind,
        status: 'UNREAD',
        pushed_at: event.occurred_at,
        event_id: event.event_id
      });
      break;
    }
    case 'notification.acknowledged': {
      const notification = findNotification(next, event.payload.notification_id);
      if (notification && notification.status === 'UNREAD') {
        notification.status = 'READ';
        notification.ack_event_id = event.event_id;
        notification.acknowledged_at = event.occurred_at;
      }
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
    return;
  }
  if (event.event_type === 'achievement.unlocked') {
    if (state.achievements.some((item) => item.id === event.payload.achievement_id)) throw new Error('achievement already unlocked');
    return;
  }
  if (event.event_type === 'shop.redeemed') {
    const item = state.shop.find((entry) => entry.id === event.payload.item_id);
    if (!item) throw new Error('shop item does not exist');
    if (!item.active) throw new Error('shop item is inactive');
    if (item.cost_coins == null) throw new Error('shop item cost is uncalibrated');
    if (state.profile.economy_status !== 'CALIBRATED') throw new Error('economy is uncalibrated');
    if (!item.repeatable && item.redemptions > 0) throw new Error('shop item is not repeatable');
    if (state.profile.coins < item.cost_coins) throw new Error('insufficient coins');
    event.payload.cost_coins = item.cost_coins;
    event.payload.item_title = item.title;
    return;
  }
  if (event.event_type === 'notification.pushed') {
    if (state.notifications.some((item) => item.id === event.payload.notification_id)) throw new Error('notification_id already exists');
    return;
  }
  if (event.event_type === 'notification.acknowledged') {
    const notification = state.notifications.find((item) => item.id === event.payload.notification_id);
    if (!notification) throw new Error('notification does not exist');
    if (notification.status !== 'UNREAD') throw new Error('notification is already acknowledged');
  }
}

export function buildSnapshot(events) {
  return events.reduce(reduceEvent, emptyState());
}
