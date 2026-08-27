// ==UserScript==
// @name         Trendyol - Repeated Order Groups (read-only)
// @namespace    ron-os
// @version      0.1.0
// @description  Groups visible Yeni Siparişler rows by barcode/SKU without reordering or clicking order actions.
// @match        https://partner.trendyol.com/*
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  const ROW_SELECTOR = 'tr,[role="row"],[data-row-key]';
  const ACTION_SELECTOR = 'button,a,[role="button"]';
  const STICKER_RE = /(?:kargo\s*etiketi.*sticker|sticker.*(?:yazd[ıi]r|print)|(?:yazd[ıi]r|print).*sticker)/i;
  const PANEL_ID = 'ron-repeat-orders-panel';
  const HIGHLIGHT_CLASS = 'ron-repeat-order-highlight';

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

  function stickerRows() {
    const actions = [...document.querySelectorAll(ACTION_SELECTOR)].filter(isStickerAction);
    const rows = actions
      .map((action) => action.closest(ROW_SELECTOR))
      .filter((row) => row && isVisible(row));
    return [...new Set(rows)];
  }

  function labeledCode(text, labels) {
    for (const label of labels) {
      const re = new RegExp(`(?:${label})\\s*[:#-]?\\s*([A-Z0-9._/-]{3,})`, 'i');
      const m = text.match(re);
      if (m?.[1]) return norm(m[1]).toUpperCase();
    }
    return null;
  }

  function productTitleFallback(row) {
    const candidates = [
      ...row.querySelectorAll('[data-testid*="product" i], [class*="product" i] [title], [class*="product" i] a, a[title], img[alt]')
    ];
    for (const el of candidates) {
      const value = norm(el.getAttribute?.('title') || el.getAttribute?.('alt') || el.textContent);
      if (value.length >= 5 && !STICKER_RE.test(value) && !/işleme al|sipariş|kargo|fatura|detay/i.test(value)) {
        return value;
      }
    }
    return null;
  }

  function identifyRow(row) {
    const text = norm(row.innerText || row.textContent);

    const barcode = labeledCode(text, ['barkod', 'barcode']);
    if (barcode) return { key: `BARCODE:${barcode}`, label: barcode, source: 'Barkod' };

    const sku = labeledCode(text, ['stok\\s*kodu', 'merchant\\s*sku', 'sku', 'ürün\\s*kodu', 'urun\\s*kodu']);
    if (sku) return { key: `SKU:${sku}`, label: sku, source: 'SKU' };

    const title = productTitleFallback(row);
    if (title) return { key: `TITLE:${title.toLocaleLowerCase('tr-TR')}`, label: title, source: 'Ürün adı' };

    return null;
  }

  function scan() {
    const rows = stickerRows();
    const groups = new Map();
    const unknown = [];

    rows.forEach((row, visualIndex) => {
      const identity = identifyRow(row);
      if (!identity) {
        unknown.push(row);
        return;
      }
      const item = { row, visualIndex, ...identity };
      if (!groups.has(identity.key)) groups.set(identity.key, []);
      groups.get(identity.key).push(item);
    });

    const repeated = [...groups.entries()]
      .map(([key, items]) => ({ key, items, count: items.length, label: items[0].label, source: items[0].source }))
      .filter((group) => group.count >= 2)
      .sort((a, b) => b.count - a.count || a.items[0].visualIndex - b.items[0].visualIndex);

    return { rows, repeated, unknown };
  }

  function clearHighlight() {
    document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach((el) => el.classList.remove(HIGHLIGHT_CLASS));
  }

  function focusGroup(group) {
    clearHighlight();
    group.items.forEach(({ row }) => row.classList.add(HIGHLIGHT_CLASS));
    group.items[0]?.row?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function injectStyle() {
    if (document.getElementById(`${PANEL_ID}-style`)) return;
    const style = document.createElement('style');
    style.id = `${PANEL_ID}-style`;
    style.textContent = `
      #${PANEL_ID} { position: fixed; right: 16px; top: 90px; z-index: 2147483646; width: 310px;
        background: #fff; border: 1px solid rgba(0,0,0,.18); border-radius: 10px; box-shadow: 0 8px 30px rgba(0,0,0,.18);
        font: 13px/1.35 Arial, sans-serif; color: #222; max-height: 70vh; overflow: auto; }
      #${PANEL_ID} .ron-head { position: sticky; top: 0; background: #fff; padding: 10px; border-bottom: 1px solid #eee; font-weight: 700; }
      #${PANEL_ID} .ron-meta { padding: 8px 10px; color: #555; border-bottom: 1px solid #eee; }
      #${PANEL_ID} button { width: 100%; text-align: left; border: 0; border-bottom: 1px solid #eee; background: #fff; padding: 9px 10px; cursor: pointer; }
      #${PANEL_ID} button:hover { background: #f5f5f5; }
      #${PANEL_ID} .ron-refresh { font-weight: 700; text-align: center; }
      .${HIGHLIGHT_CLASS} { outline: 3px solid currentColor !important; outline-offset: -3px !important; }
    `;
    document.head.appendChild(style);
  }

  function render() {
    injectStyle();
    const result = scan();
    let panel = document.getElementById(PANEL_ID);
    if (!panel) {
      panel = document.createElement('div');
      panel.id = PANEL_ID;
      document.body.appendChild(panel);
    }

    panel.replaceChildren();

    const head = document.createElement('div');
    head.className = 'ron-head';
    head.textContent = 'Tekrarlanan Siparişler';
    panel.appendChild(head);

    const meta = document.createElement('div');
    meta.className = 'ron-meta';
    const repeatedOrders = result.repeated.reduce((sum, g) => sum + g.count, 0);
    meta.textContent = `${result.rows.length} görünür sipariş • ${result.repeated.length} tekrar grubu • ${repeatedOrders} sipariş gruplandı${result.unknown.length ? ` • ${result.unknown.length} tanınmadı` : ''}`;
    panel.appendChild(meta);

    if (!result.repeated.length) {
      const empty = document.createElement('div');
      empty.className = 'ron-meta';
      empty.textContent = 'Görünür satırlarda tekrar bulunamadı.';
      panel.appendChild(empty);
    }

    for (const group of result.repeated) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = `${group.count}×  ${group.label}  [${group.source}]`;
      button.addEventListener('click', () => focusGroup(group));
      panel.appendChild(button);
    }

    const refresh = document.createElement('button');
    refresh.type = 'button';
    refresh.className = 'ron-refresh';
    refresh.textContent = 'Yenile';
    refresh.addEventListener('click', render);
    panel.appendChild(refresh);

    window.__ronRepeatOrdersLastScan = result;
    return result;
  }

  // Read-only debug surface. No printing, Done, row reordering, or synthetic order-action clicks.
  window.__ronRepeatOrdersV01 = Object.freeze({ scan, render, identifyRow, clearHighlight });

  let timer = null;
  const scheduleRender = () => {
    clearTimeout(timer);
    timer = setTimeout(render, 500);
  };

  const observer = new MutationObserver(scheduleRender);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('load', scheduleRender, { once: true });
  scheduleRender();
})();
