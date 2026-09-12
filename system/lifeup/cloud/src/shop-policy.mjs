export const SHOP_POLICY_REF = 'system-shop-economy:v1';
export const SHOP_PRICE_COINS = Object.freeze([1, 2, 4, 8]);
export const SHOP_REWARD_TYPES = Object.freeze(['COSMETIC']);
export const SHOP_FULFILLMENT_MODES = Object.freeze(['SYSTEM']);
export const SHOP_FULFILLMENT_STATUSES = Object.freeze(['PLANNED', 'VERIFIED']);

function requireObject(value, field) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${field} must be an object`);
  }
  return value;
}

function requireString(value, field, max) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field} is required`);
  const normalized = value.trim();
  if (normalized.length > max) throw new Error(`${field} is too long`);
  return normalized;
}

function requireEnum(value, allowed, field) {
  if (!allowed.includes(value)) throw new Error(`${field} must be one of: ${allowed.join(', ')}`);
  return value;
}

function requireFalse(value, field) {
  if (value !== false) throw new Error(`${field} must be false under ${SHOP_POLICY_REF}`);
  return false;
}

export function normalizeShopCandidate(input) {
  const candidate = requireObject(input, 'candidate');
  const fulfillment = requireObject(candidate.fulfillment, 'candidate.fulfillment');
  const cost = Number(candidate.cost_coins);
  if (!Number.isInteger(cost) || !SHOP_PRICE_COINS.includes(cost)) {
    throw new Error(`candidate.cost_coins must be one of: ${SHOP_PRICE_COINS.join(', ')}`);
  }
  const status = requireEnum(
    fulfillment.status,
    SHOP_FULFILLMENT_STATUSES,
    'candidate.fulfillment.status'
  );
  const verificationRef = fulfillment.verification_ref == null
    ? null
    : requireString(fulfillment.verification_ref, 'candidate.fulfillment.verification_ref', 500);
  if (status === 'VERIFIED' && !verificationRef) {
    throw new Error('verified fulfillment requires candidate.fulfillment.verification_ref');
  }
  if (status === 'PLANNED' && verificationRef) {
    throw new Error('planned fulfillment cannot claim a verification reference');
  }
  const effectKey = requireString(fulfillment.effect_key, 'candidate.fulfillment.effect_key', 100);
  if (!/^[a-z0-9][a-z0-9._-]{2,99}$/.test(effectKey)) {
    throw new Error('candidate.fulfillment.effect_key is invalid');
  }

  return {
    item_id: requireString(candidate.item_id, 'candidate.item_id', 100),
    title: requireString(candidate.title, 'candidate.title', 180),
    description: candidate.description == null
      ? ''
      : requireString(candidate.description, 'candidate.description', 1200),
    policy_ref: requireEnum(candidate.policy_ref, [SHOP_POLICY_REF], 'candidate.policy_ref'),
    reward_type: requireEnum(candidate.reward_type, SHOP_REWARD_TYPES, 'candidate.reward_type'),
    cost_coins: cost,
    external_value: requireEnum(candidate.external_value, ['NONE'], 'candidate.external_value'),
    protected_need: requireFalse(candidate.protected_need, 'candidate.protected_need'),
    mandatory_duty: requireFalse(candidate.mandatory_duty, 'candidate.mandatory_duty'),
    repeatable: requireFalse(candidate.repeatable, 'candidate.repeatable'),
    active: requireFalse(candidate.active, 'candidate.active'),
    fulfillment: {
      mode: requireEnum(fulfillment.mode, SHOP_FULFILLMENT_MODES, 'candidate.fulfillment.mode'),
      status,
      effect_key: effectKey,
      verification_ref: verificationRef
    }
  };
}

export function buildShopUpsertPlan(input, { activate = false } = {}) {
  if (typeof activate !== 'boolean') throw new Error('activate must be boolean');
  const candidate = normalizeShopCandidate(input);
  if (activate && candidate.fulfillment.status !== 'VERIFIED') {
    throw new Error('shop item cannot be activated before System fulfillment is verified');
  }
  return {
    policy_ref: SHOP_POLICY_REF,
    source_ref: SHOP_POLICY_REF,
    requires_exact_mutation_permission: true,
    fulfillment: structuredClone(candidate.fulfillment),
    action: {
      type: 'shop.item.upsert',
      payload: {
        item_id: candidate.item_id,
        title: candidate.title,
        description: candidate.description,
        cost_coins: candidate.cost_coins,
        active: activate,
        repeatable: false
      }
    }
  };
}

