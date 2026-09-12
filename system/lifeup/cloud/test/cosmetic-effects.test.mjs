import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyCosmeticEffects,
  FIRST_STEP_TITLE_ITEM_ID,
  resolvedCosmeticEffects,
  VIOLET_SHADOW_ITEM_ID
} from '../public/cosmetic-effects.js';

test('cosmetics stay locked before redemption', () => {
  assert.deepEqual(
    resolvedCosmeticEffects([
      { id: FIRST_STEP_TITLE_ITEM_ID, redemptions: 0 },
      { id: VIOLET_SHADOW_ITEM_ID, redemptions: 0 }
    ]),
    { title: null, theme: null }
  );
});

test('first-step title unlocks after one redemption and survives catalog deactivation', () => {
  assert.deepEqual(
    resolvedCosmeticEffects([{ id: FIRST_STEP_TITLE_ITEM_ID, redemptions: 1, active: false }]),
    { title: 'first-step', theme: null }
  );
});

test('violet shadow unlocks after one redemption and survives catalog deactivation', () => {
  assert.deepEqual(
    resolvedCosmeticEffects([{ id: VIOLET_SHADOW_ITEM_ID, redemptions: 1, active: false }]),
    { title: null, theme: 'violet-shadow' }
  );
});

test('both redeemed cosmetics resolve independently', () => {
  assert.deepEqual(
    resolvedCosmeticEffects([
      { id: FIRST_STEP_TITLE_ITEM_ID, redemptions: 2 },
      { id: VIOLET_SHADOW_ITEM_ID, redemptions: 1 }
    ]),
    { title: 'first-step', theme: 'violet-shadow' }
  );
});

test('applyCosmeticEffects sets and clears title and theme deterministically', () => {
  const root = { dataset: {} };
  applyCosmeticEffects([
    { id: FIRST_STEP_TITLE_ITEM_ID, redemptions: 1 },
    { id: VIOLET_SHADOW_ITEM_ID, redemptions: 1 }
  ], root);
  assert.equal(root.dataset.systemTitle, 'first-step');
  assert.equal(root.dataset.systemTheme, 'violet-shadow');

  applyCosmeticEffects([], root);
  assert.equal('systemTitle' in root.dataset, false);
  assert.equal('systemTheme' in root.dataset, false);
});
