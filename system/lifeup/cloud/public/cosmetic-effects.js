export const VIOLET_SHADOW_ITEM_ID = 'system-theme-violet-shadow-v1';
export const VIOLET_SHADOW_THEME = 'violet-shadow';

export function resolvedCosmeticEffects(shop = []) {
  const violetShadow = Array.isArray(shop)
    ? shop.find((item) => item?.id === VIOLET_SHADOW_ITEM_ID)
    : null;
  const unlocked = Number(violetShadow?.redemptions ?? 0) > 0;
  return { theme: unlocked ? VIOLET_SHADOW_THEME : null };
}

export function applyCosmeticEffects(shop = [], root = globalThis.document?.documentElement) {
  const effects = resolvedCosmeticEffects(shop);
  if (!root?.dataset) return effects;
  if (effects.theme) root.dataset.systemTheme = effects.theme;
  else delete root.dataset.systemTheme;
  return effects;
}
