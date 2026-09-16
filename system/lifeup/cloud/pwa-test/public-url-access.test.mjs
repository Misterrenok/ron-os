import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const root = new URL('../public/', import.meta.url);
const read = (name) => fs.readFile(new URL(name, root), 'utf8');

test('fresh PWA exposes no password/token login surface', async () => {
  const [html, app] = await Promise.all([read('index-v2.html'), read('app-v2.js')]);

  assert.doesNotMatch(html, /type="password"/i);
  assert.doesNotMatch(html, />\s*(Ключ доступа|Разблокировать Систему|ПОДКЛЮЧИТЬ)\s*</i);
  assert.match(html, /id="connectButton"[^>]*disabled/);
  assert.match(html, /id="tokenDialog" hidden/);
  assert.match(html, /id="tokenInput" type="hidden"/);

  // Transitional client code may still clear a legacy pre-public token, but it must
  // never persist one or attach Authorization: Bearer to current requests.
  assert.doesNotMatch(app, /sessionStorage\.setItem/);
  assert.doesNotMatch(app, /localStorage/);
  assert.doesNotMatch(app, /authorization:\s*`Bearer/i);
});
