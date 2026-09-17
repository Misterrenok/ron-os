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
  for (const residue of ['tokenDialog', 'tokenInput', 'tokenForm', 'unlockButton', 'sessionDialog', 'disconnectButton']) {
    assert.equal(html.includes(residue), false);
  }
  assert.doesNotMatch(app, /sessionStorage|localStorage|system-token|\/api\/v1\/session|authorization:\s*`Bearer/i);
  assert.match(app, /credentials:\s*'omit'/);
});
