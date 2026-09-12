export const FIRST_STEP_TITLE_ITEM_ID = 'system-title-first-step-v1';
export const FIRST_STEP_TITLE = 'first-step';
export const VIOLET_SHADOW_ITEM_ID = 'system-theme-violet-shadow-v1';
export const VIOLET_SHADOW_THEME = 'violet-shadow';

function redeemed(shop, itemId) {
  const item = Array.isArray(shop) ? shop.find((entry) => entry?.id === itemId) : null;
  return Number(item?.redemptions ?? 0) > 0;
}

export function resolvedCosmeticEffects(shop = []) {
  return {
    title: redeemed(shop, FIRST_STEP_TITLE_ITEM_ID) ? FIRST_STEP_TITLE : null,
    theme: redeemed(shop, VIOLET_SHADOW_ITEM_ID) ? VIOLET_SHADOW_THEME : null
  };
}

export function applyCosmeticEffects(shop = [], root = globalThis.document?.documentElement) {
  const effects = resolvedCosmeticEffects(shop);
  if (!root?.dataset) return effects;
  if (effects.title) root.dataset.systemTitle = effects.title;
  else delete root.dataset.systemTitle;
  if (effects.theme) root.dataset.systemTheme = effects.theme;
  else delete root.dataset.systemTheme;
  return effects;
}
