import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {
  notificationAckAction,
  notificationAckIdempotencyKey,
  notificationAckView
} from '../public/notification-actions.js';

const root = new URL('../', import.meta.url);
const read = (path) => fs.readFile(new URL(path, root), 'utf8');

test('PWA shell and manifest are Russian-first', async () => {
  const [html, manifest] = await Promise.all([read('public/index-v2.html'), read('public/manifest.webmanifest')]);
  assert.match(html, /<html lang="ru">/);
  for (const text of ['СИСТЕМА', 'СТАТУС ИГРОКА', 'ТЕКУЩЕЕ ЗАДАНИЕ', 'ХАРАКТЕРИСТИКИ', 'СИСТЕМНЫЕ СООБЩЕНИЯ']) {
    assert.match(html, new RegExp(text));
  }
  assert.match(html, /БЕЗ СРОКА — НЕ ИСТЕКАЕТ АВТОМАТИЧЕСКИ/);
  assert.match(html, /СО СРОКОМ — СЕРВЕР ЗАВЕРШИТ КАК «ИСТЕКЛО»/);
  for (const stale of ['PLAYER STATUS', '>QUESTS<', '>SKILLS<', '>NOTIFICATIONS<', 'Unlock System']) {
    assert.doesNotMatch(html, new RegExp(stale));
  }
  const parsed = JSON.parse(manifest);
  assert.equal(parsed.lang, 'ru');
  assert.equal(parsed.name, 'Система Ron');
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
  assert.match(worker, /ron-system-shell-v8/);
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
