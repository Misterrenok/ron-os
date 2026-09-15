export const SHOP_POLICY_REF = 'system-reward-economy:v2';
export const SHOP_PRICE_COINS = Object.freeze([1, 2, 4, 8, 16]);
export const SHOP_REWARD_TYPES = Object.freeze(['COSMETIC', 'REAL_WORLD_CHOICE']);
export const SHOP_FULFILLMENT_MODES = Object.freeze(['SYSTEM', 'RON']);
export const SHOP_FULFILLMENT_STATUSES = Object.freeze(['PLANNED', 'VERIFIED', 'GATED']);
export const SHOP_FINANCE_GATE_MODE = 'CURRENT_DISCRETIONARY_BUDGET';
export const SHOP_FINANCE_GATE_MAX_AGE_HOURS = 24;

const FORBIDDEN_CONVERSION_FIELDS = Object.freeze([
  'coin_rate',
  'coin_to_currency',
  'coins_per_currency',
  'currency_per_coin',
  'cash_value',
  'money_value'
]);

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

function requireBoolean(value, field) {
  if (typeof value !== 'boolean') throw new Error(`${field} must be boolean`);
  return value;
}

function rejectFixedConversion(object, field) {
  for (const key of FORBIDDEN_CONVERSION_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(object, key)) {
      throw new Error(`${field}.${key} is forbidden: Coins have no fixed cash conversion rate`);
    }
  }
}

function normalizeFulfillment(candidate) {
  const fulfillment = requireObject(candidate.fulfillment, 'candidate.fulfillment');
  rejectFixedConversion(fulfillment, 'candidate.fulfillment');
  const mode = requireEnum(fulfillment.mode, SHOP_FULFILLMENT_MODES, 'candidate.fulfillment.mode');
  const status = requireEnum(
    fulfillment.status,
    SHOP_FULFILLMENT_STATUSES,
    'candidate.fulfillment.status'
  );
  const verificationRef = fulfillment.verification_ref == null
    ? null
    : requireString(fulfillment.verification_ref, 'candidate.fulfillment.verification_ref', 500);
  const effectKey = requireString(fulfillment.effect_key, 'candidate.fulfillment.effect_key', 100);
  if (!/^[a-z0-9][a-z0-9._-]{2,99}$/.test(effectKey)) {
    throw new Error('candidate.fulfillment.effect_key is invalid');
  }
  return { mode, status, effect_key: effectKey, verification_ref: verificationRef };
}

function normalizeFinanceGateDefinition(value) {
  const gate = requireObject(value, 'candidate.finance_gate');
  rejectFixedConversion(gate, 'candidate.finance_gate');
  const mode = requireEnum(gate.mode, [SHOP_FINANCE_GATE_MODE], 'candidate.finance_gate.mode');
  const requiredAtRedemption = requireBoolean(
    gate.required_at_redemption,
    'candidate.finance_gate.required_at_redemption'
  );
  if (!requiredAtRedemption) {
    throw new Error('REAL_WORLD_CHOICE requires finance gate at redemption');
  }
  const maxAge = Number(gate.max_age_hours ?? SHOP_FINANCE_GATE_MAX_AGE_HOURS);
  if (!Number.isInteger(maxAge) || maxAge < 1 || maxAge > SHOP_FINANCE_GATE_MAX_AGE_HOURS) {
    throw new Error(`candidate.finance_gate.max_age_hours must be 1..${SHOP_FINANCE_GATE_MAX_AGE_HOURS}`);
  }
  return { mode, required_at_redemption: true, max_age_hours: maxAge };
}

export function normalizeShopCandidate(input) {
  const candidate = requireObject(input, 'candidate');
  rejectFixedConversion(candidate, 'candidate');
  const cost = Number(candidate.cost_coins);
  if (!Number.isInteger(cost) || !SHOP_PRICE_COINS.includes(cost)) {
    throw new Error(`candidate.cost_coins must be one of: ${SHOP_PRICE_COINS.join(', ')}`);
  }
  const rewardType = requireEnum(candidate.reward_type, SHOP_REWARD_TYPES, 'candidate.reward_type');
  const fulfillment = normalizeFulfillment(candidate);
  const base = {
    item_id: requireString(candidate.item_id, 'candidate.item_id', 100),
    title: requireString(candidate.title, 'candidate.title', 180),
    description: candidate.description == null
      ? ''
      : requireString(candidate.description, 'candidate.description', 1200),
    policy_ref: requireEnum(candidate.policy_ref, [SHOP_POLICY_REF], 'candidate.policy_ref'),
    reward_type: rewardType,
    cost_coins: cost,
    protected_need: requireFalse(candidate.protected_need, 'candidate.protected_need'),
    mandatory_duty: requireFalse(candidate.mandatory_duty, 'candidate.mandatory_duty'),
    repeatable: requireFalse(candidate.repeatable, 'candidate.repeatable'),
    active: requireFalse(candidate.active, 'candidate.active'),
    fulfillment
  };

  if (rewardType === 'COSMETIC') {
    base.external_value = requireEnum(candidate.external_value, ['NONE'], 'candidate.external_value');
    if (fulfillment.mode !== 'SYSTEM') throw new Error('COSMETIC fulfillment.mode must be SYSTEM');
    if (!['PLANNED', 'VERIFIED'].includes(fulfillment.status)) {
      throw new Error('COSMETIC fulfillment.status must be PLANNED or VERIFIED');
    }
    if (fulfillment.status === 'VERIFIED' && !fulfillment.verification_ref) {
      throw new Error('verified fulfillment requires candidate.fulfillment.verification_ref');
    }
    if (fulfillment.status === 'PLANNED' && fulfillment.verification_ref) {
      throw new Error('planned fulfillment cannot claim a verification reference');
    }
    if (candidate.finance_gate != null) throw new Error('COSMETIC cannot define a finance gate');
    base.finance_gate = null;
    return base;
  }

  base.external_value = requireEnum(
    candidate.external_value,
    ['BUDGET_GATED'],
    'candidate.external_value'
  );
  if (fulfillment.mode !== 'RON') throw new Error('REAL_WORLD_CHOICE fulfillment.mode must be RON');
  if (fulfillment.status !== 'GATED') throw new Error('REAL_WORLD_CHOICE fulfillment.status must be GATED');
  if (fulfillment.verification_ref) {
    throw new Error('REAL_WORLD_CHOICE cannot claim System fulfillment verification');
  }
  base.finance_gate = normalizeFinanceGateDefinition(candidate.finance_gate);
  return base;
}

export function normalizeFinanceGate(input, { now = new Date() } = {}) {
  const gate = requireObject(input, 'finance_gate');
  rejectFixedConversion(gate, 'finance_gate');
  const status = requireEnum(gate.status, ['APPROVED'], 'finance_gate.status');
  const mode = requireEnum(gate.mode, [SHOP_FINANCE_GATE_MODE], 'finance_gate.mode');
  const checkedAt = new Date(requireString(gate.checked_at, 'finance_gate.checked_at', 80));
  if (Number.isNaN(checkedAt.getTime())) throw new Error('finance_gate.checked_at must be a valid timestamp');
  const referenceNow = now instanceof Date ? now : new Date(now);
  if (Number.isNaN(referenceNow.getTime())) throw new Error('now must be a valid timestamp');
  const ageMs = referenceNow.getTime() - checkedAt.getTime();
  if (ageMs < -5 * 60 * 1000) throw new Error('finance_gate.checked_at cannot be materially in the future');
  if (ageMs > SHOP_FINANCE_GATE_MAX_AGE_HOURS * 60 * 60 * 1000) {
    throw new Error('finance gate is stale');
  }
  const currency = requireString(gate.currency, 'finance_gate.currency', 3).toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error('finance_gate.currency must be an ISO-style 3-letter code');
  const maxSpend = Number(gate.max_spend);
  if (!Number.isFinite(maxSpend) || maxSpend <= 0 || maxSpend > 1_000_000_000) {
    throw new Error('finance_gate.max_spend must be a positive finite amount');
  }
  const evidenceRef = requireString(gate.evidence_ref, 'finance_gate.evidence_ref', 500);
  return {
    status,
    mode,
    checked_at: checkedAt.toISOString(),
    currency,
    max_spend: maxSpend,
    evidence_ref: evidenceRef
  };
}

export function buildShopUpsertPlan(input, { activate = false } = {}) {
  if (typeof activate !== 'boolean') throw new Error('activate must be boolean');
  const candidate = normalizeShopCandidate(input);
  if (activate && candidate.reward_type === 'COSMETIC' && candidate.fulfillment.status !== 'VERIFIED') {
    throw new Error('shop item cannot be activated before System fulfillment is verified');
  }
  if (activate && candidate.reward_type === 'REAL_WORLD_CHOICE' && !candidate.finance_gate?.required_at_redemption) {
    throw new Error('real-world reward cannot be activated without a redemption-time finance gate');
  }
  return {
    policy_ref: SHOP_POLICY_REF,
    source_ref: SHOP_POLICY_REF,
    requires_exact_mutation_permission: true,
    external_action_authorized: false,
    fulfillment: structuredClone(candidate.fulfillment),
    action: {
      type: 'shop.item.upsert',
      payload: {
        item_id: candidate.item_id,
        title: candidate.title,
        description: candidate.description,
        cost_coins: candidate.cost_coins,
        active: activate,
        repeatable: false,
        reward_type: candidate.reward_type,
        external_value: candidate.external_value,
        fulfillment_mode: candidate.fulfillment.mode,
        finance_gate_required: candidate.reward_type === 'REAL_WORLD_CHOICE',
        finance_gate_mode: candidate.finance_gate?.mode ?? null
      }
    }
  };
}

export function buildShopRedemptionPlan(item, { finance_gate = null, now = new Date(), note = '' } = {}) {
  const input = requireObject(item, 'item');
  rejectFixedConversion(input, 'item');
  if (input.active !== true) throw new Error('shop item is inactive');
  const rewardType = requireEnum(input.reward_type ?? 'COSMETIC', SHOP_REWARD_TYPES, 'item.reward_type');
  const itemId = requireString(input.item_id ?? input.id, 'item.item_id', 100);
  const payload = { item_id: itemId, note: String(note ?? '').trim().slice(0, 500) };
  let gate = null;
  if (rewardType === 'REAL_WORLD_CHOICE') {
    gate = normalizeFinanceGate(finance_gate, { now });
    payload.finance_gate = gate;
  } else if (finance_gate != null) {
    throw new Error('COSMETIC redemption must not carry a finance gate');
  }
  return {
    policy_ref: SHOP_POLICY_REF,
    source_ref: SHOP_POLICY_REF,
    requires_exact_mutation_permission: true,
    external_action_authorized: false,
    requires_external_follow_through: rewardType === 'REAL_WORLD_CHOICE',
    finance_gate: gate,
    action: { type: 'shop.redeem', payload }
  };
}
