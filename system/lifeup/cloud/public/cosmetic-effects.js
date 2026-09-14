export const FIRST_STEP_TITLE_ITEM_ID = 'system-title-first-step-v1';
export const FIRST_STEP_TITLE = 'first-step';
export const VIOLET_SHADOW_ITEM_ID = 'system-theme-violet-shadow-v1';
export const VIOLET_SHADOW_THEME = 'violet-shadow';
export const HUNTER_FRAME_ITEM_ID = 'system-frame-hunter-v1';
export const HUNTER_FRAME = 'hunter';

export const PLAYER_AUTHORITY_LABEL = 'ПОДТВЕРЖДЁННЫЙ ПРОГРЕСС';
export const PLAYER_CORE_READY_TEXT = 'Система работает и синхронизирована.';
export const PLAYER_SHOP_EMPTY_TEXT = 'Здесь появятся доступные награды.';
export const PLAYER_PUSH_UNAVAILABLE_TEXT = 'Уведомления пока недоступны.';
export const PLAYER_PUSH_READY_TEXT = 'Одно нажатие включит напоминания о важных сроках.';
export const PLAYER_UI_STYLE_ID = 'system-player-ui-polish';
export const PLAYER_UI_CSS = `
.attribute.is-unrated { opacity: .82; border-color: rgba(91,214,255,.16); }
.attribute.is-unrated b { color: var(--muted); font-size: 21px; text-shadow: none; }
#focusPanel .focus-meta[aria-label="Правило времени задания"], #status .notice { display: none !important; }
#quests .detail-grid, #achievements .detail-grid, #shop .detail-grid { display: none; }
#notifications .notification-card .detail-grid { display: none; }
#notifications .notification-card .card-detail { padding-top: 12px; }
.player-log-card { padding-block: 13px; }
.player-log-card::before { opacity: .62; }
.player-log-summary { align-items: center; }
.player-log-summary .badge { opacity: .78; }
.player-empty { min-height: 108px; display: grid; place-items: center; padding: 24px 18px; border-style: solid; background: rgba(8,18,34,.46); }
@media (max-width: 700px) {
  .attribute.is-unrated { padding-block: 13px; }
  #notifications .notification-card > summary, #notifications .notification-card .card-detail { padding-left: 15px; padding-right: 14px; }
  #notifications .notification-card p { line-height: 1.55; }
  .player-log-card { padding: 13px 14px 13px 17px; }
  .player-log-summary { gap: 8px; }
  .player-log-summary b { font-size: 13px; }
  .player-log-summary small, .player-log-summary .badge { font-size: 9px; }
  .player-empty { min-height: 96px; padding-block: 22px; }
}
`;

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

export function playerTimingLabel(value) {
  const text = String(value ?? '').trim();
  if (text === 'Мягкая цель') return 'Рекомендовано до';
  if (text.startsWith('МЯГКАЯ ЦЕЛЬ:')) return text.replace(/^МЯГКАЯ ЦЕЛЬ:/, 'РЕКОМЕНДОВАНО ДО:');
  if (text === 'ДО ЦЕЛИ') return 'ДО ОРИЕНТИРА';
  return text;
}

export function playerRankStatusLabel(value) {
  const text = String(value ?? '').trim();
  if (/^РАНГ\s+[E-S](?:\s*·|$)/u.test(text)) return text;
  if (/^[E-S]\s*·/u.test(text)) return `РАНГ ${text}`;
  return text;
}

function setTextIfMatches(element, expected, replacement) {
  if (element?.textContent?.trim() === expected) element.textContent = replacement;
}

function setTimingText(element) {
  if (!element) return;
  const before = element.textContent?.trim() || '';
  const after = playerTimingLabel(before);
  if (after !== before) element.textContent = after;
}

function setRankStatusText(element) {
  if (!element) return;
  const before = element.textContent?.trim() || '';
  const after = playerRankStatusLabel(before);
  if (after !== before) element.textContent = after;
}

function ensurePlayerUiStyles(documentRef) {
  if (!documentRef?.head || documentRef.getElementById(PLAYER_UI_STYLE_ID)) return;
  const style = documentRef.createElement('style');
  style.id = PLAYER_UI_STYLE_ID;
  style.textContent = PLAYER_UI_CSS;
  documentRef.head.append(style);
}

function setPlayerSurfaceLabels(documentRef) {
  setTextIfMatches(documentRef.querySelector?.('#focusPanel .focus-label > span'), 'ТЕКУЩЕЕ ЗАДАНИЕ', 'АКТИВНОЕ ЗАДАНИЕ');
  setTextIfMatches(documentRef.getElementById('authorityText'), 'RON OS + ПРОВЕРЕННЫЕ ИСТОЧНИКИ', PLAYER_AUTHORITY_LABEL);
  setTextIfMatches(documentRef.querySelector?.('#skills .section-title small'), 'ТОЛЬКО ПОДТВЕРЖДЁННЫЕ', 'ПОДТВЕРЖДЁННЫЙ ПРОГРЕСС');
  setTextIfMatches(documentRef.querySelector?.('#achievements .section-title small'), 'ПРОВЕРЕННЫЕ ЭТАПЫ', 'ОТКРЫТЫЕ ЭТАПЫ');
  setTextIfMatches(documentRef.querySelector?.('#shop .section-title small'), 'БЕЗ ВНЕШНИХ ПОКУПОК', 'НАГРАДЫ ЗА ПРОГРЕСС');
  setTextIfMatches(documentRef.querySelector?.('#notifications .section-title > span'), 'СИСТЕМНЫЕ СООБЩЕНИЯ', 'СООБЩЕНИЯ СИСТЕМЫ');
  setTextIfMatches(documentRef.getElementById('tab-log'), 'ЖУРНАЛ', 'ИСТОРИЯ');
  setTextIfMatches(documentRef.querySelector?.('#log .section-title > span'), 'ЖУРНАЛ СИСТЕМЫ', 'ИСТОРИЯ');
  setTextIfMatches(documentRef.querySelector?.('#log .section-title small'), 'НЕИЗМЕНЯЕМЫЕ СОБЫТИЯ', 'КЛЮЧЕВЫЕ СОБЫТИЯ');
  setTextIfMatches(documentRef.getElementById('pushStatus'), 'Одно нажатие включит напоминания о дедлайнах.', PLAYER_PUSH_READY_TEXT);
  setRankStatusText(documentRef.getElementById('focusBadge'));
}

function replaceLogDetails(documentRef) {
  const logList = documentRef.getElementById('logList');
  for (const details of documentRef.querySelectorAll?.('#logList > details.detail-card') || []) {
    const sourceSummary = details.querySelector('summary');
    if (!sourceSummary) continue;
    const eventTitle = sourceSummary.querySelector('b')?.textContent?.trim();
    if (eventTitle === 'Сообщение прочитано') {
      details.remove();
      continue;
    }
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
  if (logList && !logList.querySelector('details.detail-card, .player-log-card, .empty')) {
    const emptyState = documentRef.createElement('div');
    emptyState.className = 'empty player-empty';
    emptyState.textContent = 'Значимых событий пока нет.';
    logList.append(emptyState);
  }
}

function localizeTiming(documentRef) {
  for (const label of documentRef.querySelectorAll?.('.quest-card dt') || []) setTimingText(label);
  setTimingText(documentRef.getElementById('focusDeadline'));
  setTimingText(documentRef.getElementById('focusTimeLabel'));
}

export function applyPlayerUiPolish(documentRef = globalThis.document) {
  if (!documentRef?.getElementById || !documentRef?.querySelectorAll) return false;
  ensurePlayerUiStyles(documentRef);
  setPlayerSurfaceLabels(documentRef);
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
  setTextIfMatches(documentRef.getElementById('pushStatus'), 'Push-ключи сервера ещё не настроены.', PLAYER_PUSH_UNAVAILABLE_TEXT);
  localizeTiming(documentRef);
  replaceLogDetails(documentRef);
  return true;
}

export function installPlayerUiPolish(documentRef = globalThis.document, MutationObserverRef = globalThis.MutationObserver) {
  if (!documentRef?.getElementById || typeof MutationObserverRef !== 'function') return null;
  let queued = false;
  const run = () => { queued = false; applyPlayerUiPolish(documentRef); };
  const schedule = () => {
    if (queued) return;
    queued = true;
    (globalThis.queueMicrotask || ((fn) => Promise.resolve().then(fn)))(run);
  };
  const observer = new MutationObserverRef(schedule);
  for (const id of ['authorityText', 'coreState', 'attributes', 'shopList', 'pushStatus', 'logList', 'questList', 'focusPanel']) {
    const target = documentRef.getElementById(id);
    if (target) observer.observe(target, { childList: true, subtree: true, characterData: true });
  }
  run();
  return observer;
}

if (globalThis.document && globalThis.MutationObserver) installPlayerUiPolish();
