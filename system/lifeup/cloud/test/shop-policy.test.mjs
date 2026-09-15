import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  SHOP_FINANCE_GATE_MODE,
  SHOP_POLICY_REF,
  SHOP_PRICE_COINS,
  buildShopRedemptionPlan,
  buildShopUpsertPlan,
  normalizeFinanceGate,
  normalizeShopCandidate
} from '../src/shop-policy.mjs';

const candidates = JSON.parse(fs.readFileSync(
  fileURLToPath(new URL('../../STARTER_SHOP_CANDIDATES.json', import.meta.url)),
  'utf8'
));

const cosmetics = candidates.filter((item) => item.reward_type === 'COSMETIC');
const realChoices = candidates.filter((item) => item.reward_type === 'REAL_WORLD_CHOICE');

function approvedGate(overrides = {}) {
  return {
    status: 'APPROVED',
    mode: SHOP_FINANCE_GATE_MODE,
    checked_at: '2026-09-15T07:30:00.000Z',
    currency: 'TRY',
    max_spend: 750,
    evidence_ref: 'finance:current-discretionary-budget:2026-09-15',
    ...overrides
  };
}

test('starter catalog contains preserved cosmetics and inactive budget-gated reward choices', () => {
  assert.equal(candidates.length, 6);
  assert.equal(cosmetics.length, 3);
  assert.equal(realChoices.length, 3);

  for (const input of candidates) {
    const candidate = normalizeShopCandidate(input);
    assert.equal(candidate.policy_ref, SHOP_POLICY_REF);
    assert.ok(SHOP_PRICE_COINS.includes(candidate.cost_coins));
    assert.equal(candidate.protected_need, false);
    assert.equal(candidate.mandatory_duty, false);
    assert.equal(candidate.repeatable, false);
    assert.equal(candidate.active, false);
    const inactivePlan = buildShopUpsertPlan(input);
    assert.equal(inactivePlan.action.payload.active, false);
    assert.equal(inactivePlan.requires_exact_mutation_permission, true);
    assert.equal(inactivePlan.external_action_authorized, false);
  }

  for (const input of cosmetics) {
    const candidate = normalizeShopCandidate(input);
    assert.equal(candidate.external_value, 'NONE');
    assert.equal(candidate.fulfillment.mode, 'SYSTEM');
    assert.equal(candidate.fulfillment.status, 'VERIFIED');
    assert.match(candidate.fulfillment.verification_ref, /^git:[0-9a-f]{40};ci:system-pwa-ci\/[0-9]+$/);
    const plan = buildShopUpsertPlan(input, { activate: true });
    assert.equal(plan.action.payload.reward_type, 'COSMETIC');
    assert.equal(plan.action.payload.finance_gate_required, false);
  }

  assert.deepEqual(realChoices.map((item) => item.cost_coins), [4, 8, 16]);
  for (const input of realChoices) {
    const candidate = normalizeShopCandidate(input);
    assert.equal(candidate.external_value, 'BUDGET_GATED');
    assert.equal(candidate.fulfillment.mode, 'RON');
    assert.equal(candidate.fulfillment.status, 'GATED');
    assert.equal(candidate.fulfillment.verification_ref, null);
    assert.deepEqual(candidate.finance_gate, {
      mode: SHOP_FINANCE_GATE_MODE,
      required_at_redemption: true,
      max_age_hours: 24
    });
    const activationPlan = buildShopUpsertPlan(input, { activate: true });
    assert.equal(activationPlan.action.payload.active, true);
    assert.equal(activationPlan.action.payload.reward_type, 'REAL_WORLD_CHOICE');
    assert.equal(activationPlan.action.payload.external_value, 'BUDGET_GATED');
    assert.equal(activationPlan.action.payload.fulfillment_mode, 'RON');
    assert.equal(activationPlan.action.payload.finance_gate_required, true);
    assert.equal(activationPlan.action.payload.finance_gate_mode, SHOP_FINANCE_GATE_MODE);
    assert.equal(activationPlan.external_action_authorized, false);
  }
});

test('real-world reward redemption requires a fresh approved finance gate and still authorizes no purchase', () => {
  const item = {
    ...realChoices[0],
    id: realChoices[0].item_id,
    active: true
  };
  assert.throws(
    () => buildShopRedemptionPlan(item, { now: new Date('2026-09-15T08:00:00.000Z') }),
    /finance_gate must be an object/
  );

  const plan = buildShopRedemptionPlan(item, {
    finance_gate: approvedGate(),
    now: new Date('2026-09-15T08:00:00.000Z'),
    note: 'Выбрать награду после отдельного решения о покупке.'
  });
  assert.equal(plan.policy_ref, SHOP_POLICY_REF);
  assert.equal(plan.requires_exact_mutation_permission, true);
  assert.equal(plan.external_action_authorized, false);
  assert.equal(plan.requires_external_follow_through, true);
  assert.equal(plan.action.type, 'shop.redeem');
  assert.equal(plan.action.payload.item_id, 'reward-choice-small-v2');
  assert.equal(plan.action.payload.finance_gate.status, 'APPROVED');
  assert.equal(plan.action.payload.finance_gate.currency, 'TRY');
  assert.equal(plan.action.payload.finance_gate.max_spend, 750);
});

test('finance gate rejects stale, future, malformed and conversion-like evidence', () => {
  const now = new Date('2026-09-15T08:00:00.000Z');
  assert.throws(
    () => normalizeFinanceGate(approvedGate({ checked_at: '2026-09-14T07:59:59.000Z' }), { now }),
    /finance gate is stale/
  );
  assert.throws(
    () => normalizeFinanceGate(approvedGate({ checked_at: '2026-09-15T08:06:00.000Z' }), { now }),
    /cannot be materially in the future/
  );
  assert.throws(
    () => normalizeFinanceGate(approvedGate({ status: 'PENDING' }), { now }),
    /finance_gate.status must be one of: APPROVED/
  );
  assert.throws(
    () => normalizeFinanceGate(approvedGate({ max_spend: 0 }), { now }),
    /max_spend must be a positive finite amount/
  );
  assert.throws(
    () => normalizeFinanceGate({ ...approvedGate(), currency_per_coin: 100 }, { now }),
    /fixed cash conversion rate/
  );
});

test('fixed Coin-to-money conversion fields fail closed at catalog and fulfillment boundaries', () => {
  for (const field of ['coin_rate', 'coin_to_currency', 'coins_per_currency', 'currency_per_coin', 'cash_value', 'money_value']) {
    const topLevel = structuredClone(realChoices[0]);
    topLevel[field] = 100;
    assert.throws(() => normalizeShopCandidate(topLevel), /fixed cash conversion rate/);

    const gateLevel = structuredClone(realChoices[0]);
    gateLevel.finance_gate[field] = 100;
    assert.throws(() => normalizeShopCandidate(gateLevel), /fixed cash conversion rate/);
  }
});

test('protected needs, mandatory duties, repeatable farming and arbitrary prices remain forbidden', () => {
  const wrongPrice = structuredClone(realChoices[0]);
  wrongPrice.cost_coins = 3;
  assert.throws(() => normalizeShopCandidate(wrongPrice), /must be one of: 1, 2, 4, 8, 16/);

  for (const [field, value, pattern] of [
    ['protected_need', true, /protected_need must be false/],
    ['mandatory_duty', true, /mandatory_duty must be false/],
    ['repeatable', true, /repeatable must be false/]
  ]) {
    const input = structuredClone(realChoices[0]);
    input[field] = value;
    assert.throws(() => normalizeShopCandidate(input), pattern);
  }
});

test('cosmetic fulfillment remains verified-System-only and needs no finance gate', () => {
  const planned = structuredClone(cosmetics[0]);
  planned.fulfillment.status = 'PLANNED';
  planned.fulfillment.verification_ref = null;
  assert.throws(
    () => buildShopUpsertPlan(planned, { activate: true }),
    /cannot be activated before System fulfillment is verified/
  );

  const activeCosmetic = { ...cosmetics[0], id: cosmetics[0].item_id, active: true };
  const plan = buildShopRedemptionPlan(activeCosmetic);
  assert.equal(plan.requires_external_follow_through, false);
  assert.equal(plan.external_action_authorized, false);
  assert.equal(plan.finance_gate, null);
  assert.equal(Object.hasOwn(plan.action.payload, 'finance_gate'), false);
  assert.throws(
    () => buildShopRedemptionPlan(activeCosmetic, { finance_gate: approvedGate() }),
    /must not carry a finance gate/
  );
});
