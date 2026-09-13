import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {
  notificationAckAction,
  notificationAckIdempotencyKey,
  notificationAckView
} from '../public/notification-actions.js';
import { activateViewState, urlForView, viewFromSearch } from '../public/view-navigation.js';

const root = new URL('../', import.meta.url);
const read = (path) => fs.readFile(new URL(path, root), 'utf8');

async function workerHarness({ offline = false, status = 200, cacheFailure = false } = {}) {
  const handlers = {}, entries = new Map(), writes = [];
  const origin = 'https://system.example';
  const key = (request) => new URL(typeof request === 'string' ? request : request.url, origin).href;
  const cache = {
    async match(request) { return entries.get(key(request))?.clone(); },
    async put(request, response) {
      if (cacheFailure) throw new Error('quota');
      writes.push(key(request)); entries.set(key(request), response);
    }
  };
  entries.set(origin + '/', new Response('cached shell'));
  vm.runInNewContext(await read('public/sw-v2.js'), {
    URL, Response, self: { location: { origin }, addEventListener(type, fn) { handlers[type] = fn; } },
    caches: { async open() { return cache; }, match: (request) => cache.match(request) },
    async fetch(request, options) {
      if (offline) throw new Error('offline');
      assert.equal(options?.cache, 'no-store');
      return new Response('network', { status });
    }
  });
  return {
    writes,
    async request(path, mode = 'navigate', method = 'GET') {
      let response; const pending = [];
      handlers.fetch({ request: { url: new URL(path, origin).href, mode, method },
        respondWith(value) { response = value; }, waitUntil(value) { pending.push(value); } });
      const result = await response;
      await Promise.all(pending);
      return result;
    }
  };
}

test('offline notification deep link returns cached shell without caching player APIs', async () => {
  const h = await workerHarness({ offline: true });
  assert.equal(await (await h.request('/?view=notifications')).text(), 'cached shell');
  assert.equal(await (await h.request('/')).text(), 'cached shell');
  for (const path of ['/api/snapshot', '/api/session', '/healthz', '/missing', 'https://other.example/']) {
    assert.equal(await h.request(path), undefined);
  }
  assert.equal(await h.request('/', 'navigate', 'POST'), undefined);
  assert.equal((await h.request('/styles.css', 'no-cors')).type, 'error');
});

test('selected PWA view survives reload without losing unrelated URL state', async () => {
  const views = ['status', 'quests', 'notifications', 'log'];
  assert.equal(viewFromSearch('?view=notifications', views), 'notifications');
  assert.equal(viewFromSearch('?view=unknown', views), 'status');
  assert.equal(viewFromSearch('', views), 'status');
  assert.equal(urlForView('https://system.example/?source=push#latest', 'log'), '/?source=push&view=log#latest');
  assert.equal(urlForView('https://system.example/?source=push&view=log#latest', 'status'), '/?source=push#latest');

  const tabs = [{ dataset: { view: 'status' } }, { dataset: { view: 'log' } }];
  const viewsForTest = [{ id: 'status' }, { id: 'log' }];
  for (const entry of [...tabs, ...viewsForTest]) {
    entry.active = false;
    entry.classList = { toggle: (_name, active) => { entry.active = active; } };
  }
  assert.equal(activateViewState(tabs, viewsForTest, 'log'), true);
  assert.deepEqual(tabs.map((entry) => entry.active), [false, true]);
  assert.deepEqual(viewsForTest.map((entry) => entry.active), [false, true]);
  assert.equal(activateViewState(tabs, viewsForTest, 'missing'), false);

  const [app, worker] = await Promise.all([read('public/app-v2.js'), read('public/sw-v2.js')]);
  assert.match(app, /history\.replaceState/);
  assert.match(app, /window\.addEventListener\('popstate'/);
  assert.match(app, /activateView\(viewFromSearch\(location\.search, allowedViews\)/);
  assert.match(worker, /view-navigation\.js/);
});

test('shell cache accepts successful responses only and normalizes navigation query', async () => {
  const h = await workerHarness();
  assert.equal(await (await h.request('/?view=notifications')).text(), 'network');
  assert.deepEqual(h.writes, ['https://system.example/']);
  const failure = await workerHarness({ status: 503 });
  assert.equal((await failure.request('/')).status, 503);
  assert.deepEqual(failure.writes, []);
  const quota = await workerHarness({ cacheFailure: true });
  assert.equal(await (await quota.request('/')).text(), 'network');
});

async function connectionHarness(fetch) {
  const elements = new Map();
  const element = (id) => {
    if (!elements.has(id)) elements.set(id, {
      textContent: 'old private value', innerHTML: 'old private card', style: {}, dataset: {}, hidden: false,
      classList: { toggle() {}, remove() {} }, listeners: {},
      addEventListener(type, fn) { this.listeners[type] = fn; }, close() {},
      querySelectorAll() { return []; }
    });
    return elements.get(id);
  };
  const source = (await read('public/app-v2.js')).replace(/^import .*;\n/gm, '').split("if ('serviceWorker' in navigator) navigator.serviceWorker.register")[0];
  const context = {
    document: { getElementById: element, querySelectorAll: () => [] },
    window: { addEventListener() {} }, navigator: {}, fetch,
    setTimeout: () => 1, clearTimeout() {},
    applyCosmeticEffects() {}, createSnapshotRefreshCoordinator: () => ({ run() {}, runAfterCurrent() {} })
  };
  vm.runInNewContext(source + '\nthis.api = { loadSnapshot, renderUnavailable, playerDescription, profileStatusText, coreStatusText, rankText, attributeCard };', context);
  return { ...context.api, element };
}

test('locked and offline screens clear private cards and never claim zero quests', async () => {
  const h = await connectionHarness(async () => ({ status: 401 }));
  await h.loadSnapshot();
  assert.equal(h.element('connectionText').textContent, 'ВОЙТИ');
  assert.equal(h.element('questCount').textContent, '—');
  assert.equal(h.element('xpValue').textContent, '—');
  assert.equal(h.element('criticalBanner').hidden, true);
  for (const id of ['questList', 'skillList', 'logList', 'attributes']) {
    assert.doesNotMatch(h.element(id).innerHTML, /old private/);
    assert.match(h.element(id).innerHTML, /ВОЙТИ/);
  }
  const offline = await connectionHarness(async () => { throw new Error('network'); });
  await offline.loadSnapshot();
  assert.equal(offline.element('connectionText').textContent, 'НЕТ СВЯЗИ');
  assert.doesNotMatch(offline.element('questList').innerHTML, /old private/);
});

test('logout clears immediately and a late successful snapshot cannot restore private data', async () => {
  let finishRead;
  const h = await connectionHarness((path) => path.endsWith('/snapshot')
    ? new Promise((resolve) => { finishRead = resolve; })
    : Promise.resolve({ status: 200, ok: true, json: async () => ({}) }));
  const pending = h.loadSnapshot();
  await h.element('disconnectButton').listeners.click();
  finishRead({ status: 200, ok: true, json: async () => ({ private: 'must not render' }) });
  assert.equal(await pending, null);
  assert.equal(h.element('focusTitle').textContent, 'Войди в Систему');
  assert.doesNotMatch(h.element('questList').innerHTML, /old private|must not render/);
});

test('failed logout does not claim that the server session was revoked', async () => {
  const h = await connectionHarness(async () => { throw new Error('offline'); });
  await h.element('disconnectButton').listeners.click();
  assert.match(h.element('feedbackBar').textContent, /выйти на сервере не удалось/);
  assert.equal(h.element('disconnectButton').disabled, false);
});

test('quest copy hides outcome metadata while preserving instructions and links', async () => {
  const h = await connectionHarness();
  assert.equal(h.playerDescription('Пройти урок. outcome_key=learning:german:hallo Затем написать 3 фразы.'), 'Пройти урок. Затем написать 3 фразы.');
  assert.equal(h.playerDescription('Открыть https://example.com/?lesson=hallo'), 'Открыть https://example.com/?lesson=hallo');
});

test('status screen explains player state in Russian without internal model identifiers', async () => {
  const h = await connectionHarness();
  assert.equal(h.profileStatusText({ initialized: true, economy_status: 'CALIBRATED' }),
    'Профиль готов · экономика активна. Характеристики без подтверждений остаются неизвестными.');
  assert.equal(h.coreStatusText(17),
    'Система работает · в истории 17 событий · состояние восстановлено из неизменяемого журнала.');
  assert.doesNotMatch(h.coreStatusText(17), /ledger|quest-v2|модель/i);

  assert.equal(h.rankText(null), 'БЕЗ РАНГА');
  assert.equal(h.rankText('E'), 'E');
  const attribute = h.attributeCard('STR', 3, { claim: 'VERIFIED', scale_ref: 'internal-scale:v1', evidence_ref: 'secret-ref' });
  assert.match(attribute, /ПОДТВЕРЖДЕНО/);
  assert.doesNotMatch(attribute, /VERIFIED|internal-scale|secret-ref|Шкала|Доказательство/);
});

test('PWA shell and manifest are Russian-first and Chromium-installable', async () => {
  const [html, manifest, icon192, icon512] = await Promise.all([
    read('public/index-v2.html'),
    read('public/manifest.webmanifest'),
    read('public/system-icon-192.svg'),
    read('public/system-icon.svg')
  ]);
  assert.match(html, /<html lang="ru">/);
  for (const text of ['СИСТЕМА', 'СТАТУС ИГРОКА', 'ТЕКУЩЕЕ ЗАДАНИЕ', 'ХАРАКТЕРИСТИКИ', 'СИСТЕМНЫЕ СООБЩЕНИЯ']) {
    assert.match(html, new RegExp(text));
  }
  assert.match(html, /БЕЗ СРОКА — НЕ ИСТЕКАЕТ/);
  assert.match(html, /ДЕДЛАЙН — СЕРВЕР ЗАВЕРШИТ КАК «ИСТЕКЛО»/);
  for (const stale of ['PLAYER STATUS', '>QUESTS<', '>SKILLS<', '>NOTIFICATIONS<', 'Unlock System']) {
    assert.doesNotMatch(html, new RegExp(stale));
  }
  const parsed = JSON.parse(manifest);
  assert.equal(parsed.lang, 'ru');
  assert.equal(parsed.name, 'Система Ron');
  assert.equal(parsed.start_url, '/');
  assert.equal(parsed.scope, '/');
  assert.equal(parsed.display, 'standalone');
  const iconSizes = new Set((parsed.icons || []).flatMap((icon) => String(icon.sizes || '').split(/\s+/)));
  assert.equal(iconSizes.has('192x192'), true);
  assert.equal(iconSizes.has('512x512'), true);
  assert.match(icon192, /width="192" height="192"/);
  assert.match(icon512, /viewBox="0 0 512 512"/);
});

test('PWA exchanges a legacy token for an HttpOnly session instead of persisting it again', async () => {
  const app = await read('public/app-v2.js');
  assert.match(app, /\/api\/v1\/session/);
  assert.match(app, /sessionStorage\.removeItem\('system-token'\)/);
  assert.doesNotMatch(app, /sessionStorage\.setItem/);
  assert.doesNotMatch(app, /localStorage/);
  assert.doesNotMatch(app, /authorization:\s*`Bearer/);
});

test('PWA exposes an explicit idempotent notification acknowledgement action', async () => {
  const [html, app, actions, styles, worker] = await Promise.all([
    read('public/index-v2.html'),
    read('public/app-v2.js'),
    read('public/notification-actions.js'),
    read('public/styles.css'),
    read('public/sw-v2.js')
  ]);
  assert.match(html, /id="feedbackBar"/);
  assert.doesNotMatch(html, /src="\/notification-actions\.js"/);
  assert.match(app, /\/api\/v1\/actions/);
  assert.match(app, /data-notification-ack/);
  assert.match(app, /notificationAckIdempotencyKey/);
  assert.match(app, /'x-system-actor': 'ron'/);
  assert.match(app, /'x-system-source': 'ron-system-pwa'/);
  assert.match(app, /scrollIntoView/);
  assert.match(app, /showFeedback/);
  assert.match(actions, /notification\.ack/);
  assert.doesNotMatch(actions, /MutationObserver|fetch\(|window\.location\.reload/);
  assert.match(styles, /min-height: 46px/);
  assert.match(worker, /notification-actions\.js/);

  assert.deepEqual(notificationAckAction('notice-1'), {
    type: 'notification.ack',
    payload: { notification_id: 'notice-1' }
  });
  assert.equal(notificationAckIdempotencyKey('notice-1'), 'pwa-notification-ack-notice-1');
  assert.deepEqual(notificationAckView({ id: 'notice-1', status: 'UNREAD' }), {
    actionable: true,
    pending: false,
    label: 'ПОДТВЕРДИТЬ'
  });
  assert.deepEqual(notificationAckView({ id: 'notice-1', status: 'UNREAD' }, new Set(['notice-1'])), {
    actionable: false,
    pending: true,
    label: 'СОХРАНЯЮ…'
  });
  assert.equal(notificationAckView({ id: 'notice-1', status: 'READ' }).label, 'ПОДТВЕРЖДЕНО');
  assert.throws(() => notificationAckAction(''), /invalid notification id/);
});

test('redeemed cosmetic assets are wired into the durable PWA shell', async () => {
  const [html, app, worker, effects, styles] = await Promise.all([
    read('public/index-v2.html'),
    read('public/app-v2.js'),
    read('public/sw-v2.js'),
    read('public/cosmetic-effects.js'),
    read('public/cosmetic-effects.css')
  ]);
  assert.match(html, /cosmetic-effects\.css/);
  assert.match(app, /applyCosmeticEffects\(state\.shop\)/);
  assert.match(worker, /cosmetic-effects\.js/);
  assert.match(worker, /cosmetic-effects\.css/);
  assert.match(effects, /system-theme-violet-shadow-v1/);
  assert.match(styles, /data-system-theme="violet-shadow"/);
});

test('future deadline and service-worker messages are Russian', async () => {
  const [deadline, worker] = await Promise.all([read('src/deadline-engine.mjs'), read('public/sw-v2.js')]);
  assert.match(deadline, /Осталось \$\{reminder\.label\}/);
  assert.match(deadline, /Задание просрочено/);
  assert.match(worker, /Система/);
  assert.match(worker, /ron-system-shell-v14/);
  assert.match(worker, /fetch\(event\.request, \{ cache: 'no-store' \}\)/);
});

test('PWA refreshes snapshots without overlap or hidden-tab polling', async () => {
  const [app, worker, refresh] = await Promise.all([
    read('public/app-v2.js'),
    read('public/sw-v2.js'),
    read('public/snapshot-refresh.js')
  ]);
  assert.match(app, /createSnapshotRefreshCoordinator/);
  assert.match(app, /refresh\(\{ afterCurrent: true \}\)/);
  assert.match(app, /document\.addEventListener\('visibilitychange', refreshWhenUsable\)/);
  assert.match(app, /window\.addEventListener\('online', refreshWhenUsable\)/);
  assert.doesNotMatch(app, /setInterval\(refresh,/);
  assert.match(worker, /snapshot-refresh\.js/);
  assert.match(refresh, /visibilityState === 'visible'/);
  assert.match(refresh, /inFlight/);
});

test('Quest cards expose only a read-only verified XMind strategy link', async () => {
  const [app, worker, strategy] = await Promise.all([
    read('public/app-v2.js'), read('public/sw-v2.js'), read('public/strategy-context.js')
  ]);
  assert.match(app, /СТРАТЕГИЧЕСКАЯ СВЯЗЬ/);
  assert.match(app, /noopener noreferrer/);
  assert.match(worker, /strategy-context\.js/);
  assert.match(strategy, /https:\/\/app\.xmind\.com\/share\//);
  assert.match(strategy, /ПРОВЕРЕНО ПО КАНОНУ/);
  assert.doesNotMatch(strategy, /fetch\(|POST|PUT|PATCH|DELETE/);
});

test('Quest and skill cards keep player-facing information free of implementation noise', async () => {
  const app = await read('public/app-v2.js');
  assert.match(app, /RECOVERY: 'ВОССТАНОВЛЕНИЕ'/);
  for (const technicalQuestCopy of ['ID задания', 'Статус ledger', 'ЗАДАНИЕ v2', 'ЗАДАНИЕ v1']) {
    assert.doesNotMatch(app, new RegExp(technicalQuestCopy));
  }
  assert.doesNotMatch(app, /skill\.scale_ref/);
  assert.doesNotMatch(app, /skill\.evidence_ref/);
  assert.doesNotMatch(app, /skill\.claim/);
  assert.doesNotMatch(app, /skill\.domain/);
});

test('PWA keeps soft targets visible without presenting them as hard deadlines', async () => {
  const [html, app, projection] = await Promise.all([
    read('public/index-v2.html'),
    read('public/app-v2.js'),
    read('public/projection.js')
  ]);
  assert.match(html, /МЯГКАЯ ЦЕЛЬ — ОРИЕНТИР/);
  assert.match(app, /МЯГКАЯ ЦЕЛЬ:/);
  assert.match(app, /Задание останется активным/);
  assert.match(app, /ЦЕЛЬ ПРОШЛА/);
  assert.match(app, /phrase: 'фразы'/);
  assert.match(projection, /kind: 'SOFT'/);
  assert.doesNotMatch(app, /МЯГКАЯ ЦЕЛЬ:.*ИСТЕКЛО/);
});
