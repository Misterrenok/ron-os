import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyCosmeticEffects,
  FIRST_STEP_TITLE_ITEM_ID,
  HUNTER_FRAME_ITEM_ID,
  isUnratedAttribute,
  PLAYER_AUTHORITY_LABEL,
  PLAYER_CORE_READY_TEXT,
  PLAYER_SHOP_EMPTY_TEXT,
  PLAYER_UI_CSS,
  PLAYER_UI_STYLE_ID,
  playerEventClaimLabel,
  resolvedCosmeticEffects,
  VIOLET_SHADOW_ITEM_ID
} from '../public/cosmetic-effects.js';

test('cosmetics stay locked before redemption', () => {
  assert.deepEqual(
    resolvedCosmeticEffects([
      { id: FIRST_STEP_TITLE_ITEM_ID, redemptions: 0 },
      { id: VIOLET_SHADOW_ITEM_ID, redemptions: 0 },
      { id: HUNTER_FRAME_ITEM_ID, redemptions: 0 }
    ]),
    { title: null, theme: null, frame: null }
  );
});

test('first-step title unlocks after one redemption and survives catalog deactivation', () => {
  assert.deepEqual(
    resolvedCosmeticEffects([{ id: FIRST_STEP_TITLE_ITEM_ID, redemptions: 1, active: false }]),
    { title: 'first-step', theme: null, frame: null }
  );
});

test('violet shadow unlocks after one redemption and survives catalog deactivation', () => {
  assert.deepEqual(
    resolvedCosmeticEffects([{ id: VIOLET_SHADOW_ITEM_ID, redemptions: 1, active: false }]),
    { title: null, theme: 'violet-shadow', frame: null }
  );
});

test('hunter frame unlocks after one redemption and survives catalog deactivation', () => {
  assert.deepEqual(
    resolvedCosmeticEffects([{ id: HUNTER_FRAME_ITEM_ID, redemptions: 1, active: false }]),
    { title: null, theme: null, frame: 'hunter' }
  );
});

test('all redeemed cosmetics resolve independently', () => {
  assert.deepEqual(
    resolvedCosmeticEffects([
      { id: FIRST_STEP_TITLE_ITEM_ID, redemptions: 2 },
      { id: VIOLET_SHADOW_ITEM_ID, redemptions: 1 },
      { id: HUNTER_FRAME_ITEM_ID, redemptions: 1 }
    ]),
    { title: 'first-step', theme: 'violet-shadow', frame: 'hunter' }
  );
});

test('applyCosmeticEffects sets and clears title theme and frame deterministically', () => {
  const root = { dataset: {} };
  applyCosmeticEffects([
    { id: FIRST_STEP_TITLE_ITEM_ID, redemptions: 1 },
    { id: VIOLET_SHADOW_ITEM_ID, redemptions: 1 },
    { id: HUNTER_FRAME_ITEM_ID, redemptions: 1 }
  ], root);
  assert.equal(root.dataset.systemTitle, 'first-step');
  assert.equal(root.dataset.systemTheme, 'violet-shadow');
  assert.equal(root.dataset.systemFrame, 'hunter');

  applyCosmeticEffects([], root);
  assert.equal('systemTitle' in root.dataset, false);
  assert.equal('systemTheme' in root.dataset, false);
  assert.equal('systemFrame' in root.dataset, false);
});

test('player-facing polish keeps unknown evidence honest without repeating technical noise', () => {
  assert.equal(isUnratedAttribute('--', 'НЕИЗВЕСТНО'), true);
  assert.equal(isUnratedAttribute('—', 'НЕИЗВЕСТНО'), true);
  assert.equal(isUnratedAttribute('3', 'ПОДТВЕРЖДЕНО'), false);
  assert.equal(playerEventClaimLabel('ВЫЧИСЛЕНО'), 'СИСТЕМОЙ');
  assert.equal(playerEventClaimLabel('ПОДТВЕРЖДЕНО'), 'ПОДТВЕРЖДЕНО');
  assert.equal(PLAYER_AUTHORITY_LABEL, 'ТОЛЬКО ПОДТВЕРЖДЁННЫЕ');
  assert.equal(PLAYER_CORE_READY_TEXT, 'Система работает и синхронизирована.');
  assert.equal(PLAYER_SHOP_EMPTY_TEXT, 'Здесь появятся доступные награды.');
});

test('mobile polish styles target the noisy surfaces without changing gameplay state', () => {
  assert.equal(PLAYER_UI_STYLE_ID, 'system-player-ui-polish');
  assert.match(PLAYER_UI_CSS, /attribute\.is-unrated/);
  assert.match(PLAYER_UI_CSS, /#notifications \.notification-card \.detail-grid/);
  assert.match(PLAYER_UI_CSS, /player-log-card/);
  assert.match(PLAYER_UI_CSS, /player-empty/);
  assert.match(PLAYER_UI_CSS, /max-width: 700px/);
});
