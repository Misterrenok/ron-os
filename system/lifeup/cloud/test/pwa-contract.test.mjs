import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => fs.readFile(new URL(path, root), 'utf8');

test('PWA shell and manifest are Russian-first', async () => {
  const [html, manifest] = await Promise.all([read('public/index-v2.html'), read('public/manifest.webmanifest')]);
  assert.match(html, /<html lang="ru">/);
  for (const text of ['СИСТЕМА', 'СТАТУС ИГРОКА', 'ТЕКУЩЕЕ ЗАДАНИЕ', 'ХАРАКТЕРИСТИКИ', 'СИСТЕМНЫЕ СООБЩЕНИЯ']) {
    assert.match(html, new RegExp(text));
  }
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

test('future deadline and service-worker messages are Russian', async () => {
  const [deadline, worker] = await Promise.all([read('src/deadline-engine.mjs'), read('public/sw-v2.js')]);
  assert.match(deadline, /Осталось \$\{reminder\.label\}/);
  assert.match(deadline, /Задание просрочено/);
  assert.match(worker, /Система/);
  assert.match(worker, /ron-system-shell-v4/);
});
