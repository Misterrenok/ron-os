import test from 'node:test';
import assert from 'node:assert/strict';
import { applyCosmeticEffects, resolvedCosmeticEffects, VIOLET_SHADOW_ITEM_ID } from '../public/cosmetic-effects.js';

test('violet shadow stays locked before redemption', () => {
  assert.deepEqual(resolvedCosmeticEffects([{ id: VIOLET_SHADOW_ITEM_ID, redemptions: 0 }]), { theme: null });
});

test('violet shadow unlocks after one redemption and survives catalog deactivation', () => {
  assert.deepEqual(resolvedCosmeticEffects([{ id: VIOLET_SHADOW_ITEM_ID, redemptions: 1, active: false }]), { theme: 'violet-shadow' });
});

test('applyCosmeticEffects sets and clears the document theme deterministically', () => {
  const root = { dataset: {} };
  applyCosmeticEffects([{ id: VIOLET_SHADOW_ITEM_ID, redemptions: 1 }], root);
  assert.equal(root.dataset.systemTheme, 'violet-shadow');
  applyCosmeticEffects([], root);
  assert.equal('systemTheme' in root.dataset, false);
});
