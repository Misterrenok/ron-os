import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  SHOP_POLICY_REF,
  SHOP_PRICE_COINS,
  buildShopUpsertPlan,
  normalizeShopCandidate
} from '../src/shop-policy.mjs';

const candidates = JSON.parse(fs.readFileSync(
  fileURLToPath(new URL('../../STARTER_SHOP_CANDIDATES.json', import.meta.url)),
  'utf8'
));

test('starter catalog remains safe and inactive while fulfillment advances independently', () => {
  assert.equal(candidates.length, 3);
  for (const input of candidates) {
    const candidate = normalizeShopCandidate(input);
    assert.equal(candidate.policy_ref, SHOP_POLICY_REF);
    assert.ok(SHOP_PRICE_COINS.includes(candidate.cost_coins));
    assert.equal(candidate.reward_type, 'COSMETIC');
    assert.equal(candidate.external_value, 'NONE');
    assert.equal(candidate.protected_need, false);
    assert.equal(candidate.mandatory_duty, false);
    assert.equal(candidate.repeatable, false);
    assert.equal(candidate.active, false);
    assert.equal(candidate.fulfillment.mode, 'SYSTEM');
    const inactivePlan = buildShopUpsertPlan(input);
    assert.equal(inactivePlan.action.payload.active, false);
    assert.equal(inactivePlan.requires_exact_mutation_permission, true);

    if (candidate.fulfillment.status === 'PLANNED') {
      assert.equal(candidate.fulfillment.verification_ref, null);
      assert.throws(
        () => buildShopUpsertPlan(input, { activate: true }),
        /cannot be activated before System fulfillment is verified/
      );
    } else {
      assert.equal(candidate.fulfillment.status, 'VERIFIED');
      assert.ok(candidate.fulfillment.verification_ref);
      const activationPlan = buildShopUpsertPlan(input, { activate: true });
      assert.equal(activationPlan.action.payload.active, true);
      assert.equal(activationPlan.requires_exact_mutation_permission, true);
    }
  }

  for (const itemId of ['system-title-first-step-v1', 'system-theme-violet-shadow-v1']) {
    const verified = candidates.find((item) => item.item_id === itemId);
    assert.equal(verified.fulfillment.status, 'VERIFIED');
    assert.match(verified.fulfillment.verification_ref, /^git:[0-9a-f]{40};ci:system-pwa-ci\/[0-9]+$/);
    assert.equal(verified.active, false);
  }
});

test('verified System fulfillment can produce an exact permission-gated action plan', () => {
  const input = structuredClone(candidates[0]);
  input.fulfillment.status = 'VERIFIED';
  input.fulfillment.verification_ref = 'ci:system-title-first-step-v1';
  const plan = buildShopUpsertPlan(input, { activate: true });
  assert.equal(plan.policy_ref, SHOP_POLICY_REF);
  assert.equal(plan.source_ref, SHOP_POLICY_REF);
  assert.equal(plan.requires_exact_mutation_permission, true);
  assert.deepEqual(plan.action, {
    type: 'shop.item.upsert',
    payload: {
      item_id: 'system-title-first-step-v1',
      title: 'Титул: Первый шаг',
      description: 'Косметический титул профиля за первое подтверждённое продвижение.',
      cost_coins: 1,
      active: true,
      repeatable: false
    }
  });
});

test('arbitrary prices and repeatable starter rewards fail closed', () => {
  const wrongPrice = structuredClone(candidates[0]);
  wrongPrice.cost_coins = 3;
  assert.throws(() => normalizeShopCandidate(wrongPrice), /must be one of: 1, 2, 4, 8/);

  const repeatable = structuredClone(candidates[0]);
  repeatable.repeatable = true;
  assert.throws(() => normalizeShopCandidate(repeatable), /repeatable must be false/);
});

test('external value, protected needs and mandatory duties fail closed', () => {
  for (const [field, value, pattern] of [
    ['external_value', 'PURCHASE', /external_value must be one of: NONE/],
    ['protected_need', true, /protected_need must be false/],
    ['mandatory_duty', true, /mandatory_duty must be false/]
  ]) {
    const input = structuredClone(candidates[0]);
    input[field] = value;
    assert.throws(() => normalizeShopCandidate(input), pattern);
  }
});

test('only System-controlled cosmetic fulfillment is accepted', () => {
  const leisure = structuredClone(candidates[0]);
  leisure.reward_type = 'OPTIONAL_LEISURE';
  assert.throws(() => normalizeShopCandidate(leisure), /reward_type must be one of: COSMETIC/);

  const external = structuredClone(candidates[0]);
  external.fulfillment.mode = 'EXTERNAL';
  assert.throws(() => normalizeShopCandidate(external), /fulfillment.mode must be one of: SYSTEM/);

  const falseVerification = structuredClone(candidates[0]);
  falseVerification.fulfillment.status = 'VERIFIED';
  falseVerification.fulfillment.verification_ref = null;
  assert.throws(() => normalizeShopCandidate(falseVerification), /verified fulfillment requires/);
});
