export const FIRST_STEP_TITLE_ITEM_ID = 'system-title-first-step-v1';
export const FIRST_STEP_TITLE = 'first-step';
export const VIOLET_SHADOW_ITEM_ID = 'system-theme-violet-shadow-v1';
export const VIOLET_SHADOW_THEME = 'violet-shadow';
export const HUNTER_FRAME_ITEM_ID = 'system-frame-hunter-v1';
export const HUNTER_FRAME = 'hunter';

export const PLAYER_AUTHORITY_LABEL = 'ТОЛЬКО ПОДТВЕРЖДЁННЫЕ';
export const PLAYER_CORE_READY_TEXT = 'Система работает и синхронизирована.';
export const PLAYER_SHOP_EMPTY_TEXT = 'Здесь появятся доступные награды.';
export const PLAYER_PUSH_UNAVAILABLE_TEXT = 'Уведомления пока недоступны.';

function redeemed(shop, itemId) {
  const item = Array.isArray(shop) ? shop.find((entry) => entry?.id === itemId) : null;
  return Number(item?.redemptions ?? 0) > 0;
}

export function resolvedCosmeticEffects(shop = []) {
  return {
    title: redeemed(shop, FIRST_STEP_TITLE_ITEM_ID) ? FIRST_STEP_TITLE : null,
    theme: redeemed(shop, VIOLET_SHADOW_ITEM_ID) ? VIOLET_SHADOW_THEME : null,
    frame: redeemed(shop, HUNTER_FRAME_ITEM_ID) ? HUNTER_FRAME : null
  };
}

export function applyCosmeticEffects(shop = [], root = globalThis.document?.documentElement) {
  const effects = resolvedCosmeticEffects(shop);
  if (!root?.dataset) return effects;
  if (effects.title) root.dataset.systemTitle = effects.title;
  else delete root.dataset.systemTitle;
  if (effects.theme) root.dataset.systemTheme = effects.theme;
  else delete root.dataset.systemTheme;
  if (effects.frame) root.dataset.systemFrame = effects.frame;
  else delete root.dataset.systemFrame;
  return effects;
}

export function isUnratedAttribute(value, status) {
  const normalized = String(value ?? '').trim();
  return ['--', '—', ''].includes(normalized) && String(status ?? '').trim() === 'НЕИЗВЕСТНО';
}

export function playerEventClaimLabel(value) {
  return String(value ?? '').trim() === 'ВЫЧИСЛЕНО' ? 'СИСТЕМОЙ' : String(value ?? '').trim();
}

function setTextIfMatches(element, expected, replacement) {
  if (element?.textContent?.trim() === expected) element.textContent = replacement;
}

function replaceLogDetails(documentRef) {
  for (const details of documentRef.querySelectorAll?.('#logList > details.detail-card') || []) {
    const sourceSummary = details.querySelector('summary');
    if (!sourceSummary) continue;
    const card = documentRef.createElement('article');
    card.className = 'card player-log-card';
    const summary = documentRef.createElement('div');
    summary.className = 'card-summary player-log-summary';
    for (const child of sourceSummary.children) summary.append(child.cloneNode(true));
    const badge = summary.querySelector('.badge');
    if (badge) badge.textContent = playerEventClaimLabel(badge.textContent);
    card.append(summary);
    details.replaceWith(card);
  }
}

export function applyPlayerUiPolish(documentRef = globalThis.document) {
  if (!documentRef?.getElementById || !documentRef?.querySelectorAll) return false;

  setTextIfMatches(documentRef.getElementById('authorityText'), 'RON OS + ПРОВЕРЕННЫЕ ИСТОЧНИКИ', PLAYER_AUTHORITY_LABEL);
  const core = documentRef.getElementById('coreState');
  if (core?.textContent?.trim().startsWith('Система работает ·')) core.textContent = PLAYER_CORE_READY_TEXT;

  for (const card of documentRef.querySelectorAll('.attribute')) {
    const value = card.querySelector('summary b');
    const status = card.querySelector('summary small');
    const unrated = isUnratedAttribute(value?.textContent, status?.textContent);
    card.classList.toggle('is-unrated', unrated);
    if (unrated && value?.textContent !== '—') value.textContent = '—';
    if (status && status.hidden !== unrated) status.hidden = unrated;
  }

  const shopEmpty = documentRef.querySelector('#shopList .empty');
  setTextIfMatches(shopEmpty, 'Магазин наград пока не настроен.', PLAYER_SHOP_EMPTY_TEXT);
  shopEmpty?.classList.add('player-empty');

  const pushStatus = documentRef.getElementById('pushStatus');
  setTextIfMatches(pushStatus, 'Push-ключи сервера ещё не настроены.', PLAYER_PUSH_UNAVAILABLE_TEXT);

  replaceLogDetails(documentRef);
  return true;
}

export function installPlayerUiPolish(documentRef = globalThis.document, MutationObserverRef = globalThis.MutationObserver) {
  if (!documentRef?.getElementById || typeof MutationObserverRef !== 'function') return null;
  let queued = false;
  const run = () => {
    queued = false;
    applyPlayerUiPolish(documentRef);
  };
  const schedule = () => {
    if (queued) return;
    queued = true;
    (globalThis.queueMicrotask || ((fn) => Promise.resolve().then(fn)))(run);
  };
  const observer = new MutationObserverRef(schedule);
  for (const id of ['authorityText', 'coreState', 'attributes', 'shopList', 'pushStatus', 'logList']) {
    const target = documentRef.getElementById(id);
    if (target) observer.observe(target, { childList: true, subtree: true, characterData: true });
  }
  run();
  return observer;
}

if (globalThis.document && globalThis.MutationObserver) installPlayerUiPolish();
