// Trendyol print automation 2.2 candidate — SAFE NEXT augmentation only.
// Intended to be merged into the confirmed 2.1-rollback userscript after live source inspection.
// It does NOT change Sticker printing, preview auto-close, or Done/Ctrl+Alt+I.
(() => {
  'use strict';

  const NEXT_ROW_KEY = '__ronTrendyolNextRowV22';
  const STICKER_RE = /(?:kargo\s*etiketi.*sticker|sticker.*(?:yazd[ıi]r|print)|(?:yazd[ıi]r|print).*sticker)/i;
  const ROW_SELECTOR = 'tr,[role="row"],[data-row-key]';
  const ACTION_SELECTOR = 'button,a,[role="button"]';

  let currentRow = null;

  const norm = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
  const isVisible = (el) => {
    if (!el || typeof el.getBoundingClientRect !== 'function') return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const isDisabled = (el) => Boolean(
    el?.disabled ||
    el?.getAttribute?.('aria-disabled') === 'true' ||
    el?.getAttribute?.('disabled') !== null
  );
  const actionText = (el) => norm([
    el?.innerText,
    el?.textContent,
    el?.getAttribute?.('aria-label'),
    el?.getAttribute?.('title')
  ].filter(Boolean).join(' '));
  const isStickerAction = (el) => !isDisabled(el) && isVisible(el) && STICKER_RE.test(actionText(el));

  function rowForAction(action) {
    const row = action?.closest?.(ROW_SELECTOR) ?? null;
    if (!row || !isVisible(row)) return null;
    return row;
  }

  function rowScope(row) {
    // Prefer the immediate table/rowgroup parent. We refuse to cross into a different list/table.
    return row?.closest?.('tbody,[role="rowgroup"],table') ?? row?.parentElement ?? null;
  }

  function visibleRows(scope) {
    if (!scope?.querySelectorAll) return [];
    return [...scope.querySelectorAll(ROW_SELECTOR)].filter((row) => {
      if (!isVisible(row)) return false;
      // Avoid nested-row duplicates: keep rows whose nearest row scope is this scope.
      return rowScope(row) === scope || row.parentElement === scope;
    });
  }

  function chooseNextRow(rows, fromRow) {
    if (!fromRow || !rows.includes(fromRow)) return null;
    const fromRect = fromRow.getBoundingClientRect();
    const epsilon = 1;
    const below = rows
      .map((row) => ({ row, rect: row.getBoundingClientRect() }))
      .filter(({ row, rect }) => row !== fromRow && rect.top > fromRect.top + epsilon)
      .sort((a, b) => a.rect.top - b.rect.top);
    return below[0]?.row ?? null;
  }

  function uniqueStickerAction(row) {
    if (!row?.querySelectorAll) return null;
    const matches = [...row.querySelectorAll(ACTION_SELECTOR)].filter(isStickerAction);
    return matches.length === 1 ? matches[0] : null;
  }

  function setCurrentRow(row) {
    currentRow = row;
    window[NEXT_ROW_KEY] = row?.getAttribute?.('data-row-key') || null;
  }

  function rememberRowFromTrustedStickerClick(event) {
    // Initial attribution must come from a real user click, never from arbitrary synthetic DOM clicks.
    if (!event?.isTrusted) return false;
    const action = event.target?.closest?.(ACTION_SELECTOR) ?? null;
    if (!action || !isStickerAction(action)) return false;
    const row = rowForAction(action);
    if (!row) return false;
    setCurrentRow(row);
    return true;
  }

  function printNextBelow() {
    if (!currentRow || !currentRow.isConnected) {
      console.warn('[Trendyol NEXT] blocked: no exact current printed row is known. Click the current row Sticker once first.');
      return false;
    }

    const scope = rowScope(currentRow);
    if (!scope) {
      console.warn('[Trendyol NEXT] blocked: current row scope is unknown.');
      return false;
    }

    const rows = visibleRows(scope);
    const nextRow = chooseNextRow(rows, currentRow);
    if (!nextRow) {
      console.warn('[Trendyol NEXT] blocked: no unambiguous visible row exists below the current row.');
      return false;
    }

    const sticker = uniqueStickerAction(nextRow);
    if (!sticker) {
      console.warn('[Trendyol NEXT] blocked: next row does not contain exactly one visible enabled Sticker action.');
      return false;
    }

    // Synthetic click is assistant-owned and is not allowed to establish initial attribution.
    // Advance currentRow only after the exact chosen Sticker click dispatch returns successfully.
    sticker.click();
    setCurrentRow(nextRow);
    return true;
  }

  document.addEventListener('click', (event) => {
    rememberRowFromTrustedStickerClick(event);
  }, true);

  document.addEventListener('keydown', (event) => {
    if (!(event.ctrlKey && event.altKey && !event.shiftKey && !event.metaKey && event.code === 'KeyP')) return;
    // Do not steal the hotkey unless we actually have an exact row context.
    if (!currentRow || !currentRow.isConnected) return;
    event.preventDefault();
    event.stopPropagation();
    printNextBelow();
  }, true);

  // Small debug surface for deterministic console checks; not used by normal flow.
  window.__ronTrendyolNextV22 = Object.freeze({
    chooseNextRow,
    printNextBelow,
    rememberRowFromTrustedStickerClick,
    getCurrentRow: () => currentRow,
  });
})();
