import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {
  notificationAckAction,
  notificationAckIdempotencyKey,
  notificationAckView
} from '../public/notification-actions.js';
import { progressionPlayerText } from '../public/projection.js';
import { activateViewState, tabStripScrollLeft, urlForView, viewForNavigationKey, viewFromSearch } from '../public/view-navigation.js';

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
    entry.attributes = {};
    entry.setAttribute = (name, value) => { entry.attributes[name] = value; };
    entry.classList = { toggle: (_name, active) => { entry.active = active; } };
  }
  assert.equal(activateViewState(tabs, viewsForTest, 'log'), true);
  assert.deepEqual(tabs.map((entry) => entry.active), [false, true]);
  assert.deepEqual(tabs.map((entry) => entry.attributes['aria-selected']), ['false', 'true']);
  assert.deepEqual(tabs.map((entry) => entry.tabIndex), [-1, 0]);
  assert.deepEqual(viewsForTest.map((entry) => entry.active), [false, true]);
  assert.deepEqual(viewsForTest.map((entry) => entry.hidden), [true, false]);
  assert.equal(activateViewState(tabs, viewsForTest, 'missing'), false);
  assert.equal(viewForNavigationKey(views, 'status', 'ArrowRight'), 'quests');
  assert.equal(viewForNavigationKey(views, 'status', 'ArrowLeft'), 'log');
  assert.equal(viewForNavigationKey(views, 'quests', 'End'), 'log');
  assert.equal(viewForNavigationKey(views, 'log', 'Home'), 'status');
  assert.equal(viewForNavigationKey(views, 'log', 'Enter'), null);
  assert.equal(tabStripScrollLeft({ itemLeft: 20, itemWidth: 80, scrollLeft: 0, viewportWidth: 320 }), 0);
  assert.equal(tabStripScrollLeft({ itemLeft: 360, itemWidth: 90, scrollLeft: 0, viewportWidth: 320 }), 130);
  assert.equal(tabStripScrollLeft({ itemLeft: 40, itemWidth: 80, scrollLeft: 120, viewportWidth: 320 }), 40);
  assert.equal(tabStripScrollLeft({ itemLeft: 360, itemWidth: 90, scrollLeft: 130, viewportWidth: 320 }), 130);

  const [html, app, worker, styles] = await Promise.all([read('public/index-v2.html'), read('public/app-v2.js'), read('public/sw-v2.js'), read('public/styles.css')]);
  assert.match(html, /role="tablist"/);
  assert.match(html, /aria-orientation="horizontal"/);
  assert.equal((html.match(/role="tab"/g) || []).length, 7);
  assert.equal((html.match(/role="tabpanel"/g) || []).length, 7);
  assert.match(app, /history\.replaceState/);
  assert.match(app, /window\.addEventListener\('popstate'/);
  assert.match(app, /activateView\(viewFromSearch\(location\.search, allowedViews\)/);
  assert.match(app, /viewForNavigationKey/);
  assert.match(app, /tabStripScrollLeft/);
  assert.match(app, /tabStrip\.scrollLeft/);
  assert.match(styles, /\.tab:focus-visible/);
  assert.match(styles, /\.tab \{[^}]*min-height: 46px/);
  assert.match(worker, /view-navigation\.js/);
  assert.match(worker, /ron-system-shell-v20/);
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
      addEventListener(type, fn) { this.listeners[type] = fn; }, showModal() { this.open = true; }, close() { this.open = false; },
      querySelectorAll() { return []; }
    });
    return elements.get(id);
  };
  const source = (await read('public/app-v2.js')).replace(/^import .*;\n/gm, '').split("if ('serviceWorker' in navigator) navigator.serviceWorker.register")[0];
  const context = {
    document: { getElementById: element, querySelectorAll: () => [] },
    window: { addEventListener() {} }, navigator: {}, fetch,
    setTimeout: () => 1, clearTimeout() {},
    progressionPlayerText,
    applyCosmeticEffects() {}, createSnapshotRefreshCoordinator: () => ({ run() {}, runAfterCurrent() {} })
  };
  vm.runInNewContext(source + '\nthis.api = { loadSnapshot, renderUnavailable, playerDescription, profileStatusText, coreStatusText, rankText, attributeCard, renderProgression };', context);
  return { ...context.api, element };
}

test('offline screen clears stale cards and never claims zero quests', async () => {
  const h = await connectionHarness(async () => { throw new Error('network'); });
  await h.loadSnapshot();
  assert.equal(h.element('connectionText').textContent, 'НЕТ СВЯЗИ');
  assert.equal(h.element('questCount').textContent, '—');
  assert.equal(h.element('xpValue').textContent, '—');
  assert.equal(h.element('criticalBanner').hidden, true);
  for (const id of ['questList', 'skillList', 'logList', 'attributes']) {
    assert.doesNotMatch(h.element(id).innerHTML, /old private/);
    assert.match(h.element(id).innerHTML, /временно недоступна/i);
  }
  assert.equal(h.element('progressionBoss').textContent, 'БОСС: —');
  assert.equal(h.element('progressionArc').textContent, 'АРКА: —');
  assert.equal(h.element('progressionRank').textContent, 'РАНГ: —');
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

test('progression panel shows only read-only player-facing growth and gates', async () => {
  const [html, app] = await Promise.all([read('public/index-v2.html'), read('public/app-v2.js')]);
  for (const id of ['progressionGrowth', 'progressionBoss', 'progressionArc', 'progressionRank', 'progressionNext']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(app, /renderProgression\(state\.progression\)/);
  const h = await connectionHarness();
  h.renderProgression({
    read_only: true,
    visible_growth: 'Подтверждённых результатов Quest v2: 2',
    boss: { label: 'Кандидат Boss Quest подтверждён' },
    arc: { label: 'Этап арки подтверждён' },
    rank: { label: 'Эволюция ранга откроется только после отдельной подтверждённой политики' },
    next_progression_gate: 'Подтверждён этап арки',
    reward_delta: { xp: 0, coins: 0 },
    action: null
  });
  assert.equal(h.element('progressionGrowth').textContent, 'Подтверждённых результатов Quest v2: 2');
  assert.match(h.element('progressionBoss').textContent, /^БОСС:/);
  assert.match(h.element('progressionArc').textContent, /^АРКА:/);
  assert.match(h.element('progressionRank').textContent, /^РАНГ:/);
  for (const id of ['progressionGrowth', 'progressionBoss', 'progressionArc', 'progressionRank', 'progressionNext']) {
    assert.doesNotMatch(h.element(id).textContent, /policy_ref|evidence_ref|sha256|reward_delta|action/i);
  }
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

test('install action prompts when available and otherwise opens usable Russian help', async () => {
  const [html, app, worker] = await Promise.all([
    read('public/index-v2.html'),
    read('public/app-v2.js'),
    read('public/sw-v2.js')
  ]);
  assert.match(html, /id="installButton"[^>]*hidden/);
  assert.match(html, /id="installDialog"/);
  assert.match(app, /beforeinstallprompt/);
  assert.match(app, /appinstalled/);
  assert.match(app, /display-mode: standalone/);
  assert.match(app, /installDialog\.showModal\(\)/);
  assert.match(app, /catch \{[\s\S]*installDialog\.showModal\(\)/);
  assert.match(app, /closeInstallButton\.addEventListener/);
  assert.match(worker, /ron-system-shell-v20/);

  const h = await connectionHarness(async () => ({ status: 401 }));
  await h.element('installButton').listeners.click();
  assert.equal(h.element('installDialog').open, true);
  h.element('closeInstallButton').listeners.click();
  assert.equal(h.element('installDialog').open, false);
});

test('PWA contains no legacy token or session compatibility path', async () => {
  const app = await read('public/app-v2.js');
  assert.doesNotMatch(app, /\/api\/v1\/session/);
  assert.doesNotMatch(app, /sessionStorage|localStorage|system-token|createDeviceSession|migrateLegacySession/);
  assert.doesNotMatch(app, /authorization:\s*`Bearer/);
  assert.match(app, /credentials:\s*'omit'/);
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
  assert.match(worker, /push-key-rotation\.js/);
  assert.match(app, /subscriptionUsesPublicKey/);
  assert.match(app, /ОБНОВИТЬ PUSH/);
  assert.match(app, /Напоминание запланировано/);
  assert.match(app, /push-напоминания Системы/);

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
  assert.match(worker, /ron-system-shell-v20/);
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

test('PWA presents recommended windows as planning-only rather than soft goals or hard deadlines', async () => {
  const [html, app, projection] = await Promise.all([
    read('public/index-v2.html'),
    read('public/app-v2.js'),
    read('public/projection.js')
  ]);
  assert.match(html, /РЕКОМЕНДУЕМОЕ ВРЕМЯ — ОРИЕНТИР/);
  assert.match(app, /РЕКОМЕНДУЕМОЕ ВРЕМЯ:/);
  assert.match(app, /Рекомендуемое время/);
  assert.match(app, /Задание останется активным/);
  assert.match(app, /ДО ОРИЕНТИРА/);
  assert.match(app, /phrase: 'фразы'/);
  assert.match(projection, /kind: 'SOFT'/);
  assert.doesNotMatch(html, /МЯГКАЯ ЦЕЛЬ|ЦЕЛЬ ПРОШЛА/);
  assert.doesNotMatch(app, /МЯГКАЯ ЦЕЛЬ|ЦЕЛЬ ПРОШЛА/);
  assert.match(app, /soft-target-/);
  assert.match(app, /Рекомендуемое время было пропущено/);
  assert.match(app, /Архивное уведомление старой схемы времени/);
});
