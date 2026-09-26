import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

async function read(relative) {
  return fs.readFile(new URL(relative, import.meta.url), 'utf8');
}

test('active System runtime has no authentication/session compatibility residue', async () => {
  const [server, app, html, sw] = await Promise.all([
    read('../src/server-v2.mjs'),
    read('../public/app-v2.js'),
    read('../public/index-v2.html'),
    read('../public/sw-v2.js')
  ]);

  assert.doesNotMatch(server, /\/api\/v1\/session/);
  assert.match(server, /authentication_required:\s*false/);
  assert.match(server, /bearer_token:\s*false/);

  for (const forbidden of [
    'tokenDialog', 'tokenInput', 'tokenForm', 'unlockButton', 'sessionDialog',
    'disconnectButton', 'system-token', 'createDeviceSession', 'migrateLegacySession',
    '/api/v1/session', 'UNAUTHORIZED', 'ТРЕБУЕТСЯ ВХОД', 'Войди в Систему', 'Сначала разблокируй'
  ]) {
    assert.equal(app.includes(forbidden), false, `app-v2.js must not contain ${forbidden}`);
    assert.equal(html.includes(forbidden), false, `index-v2.html must not contain ${forbidden}`);
  }

  assert.match(app, /credentials:\s*'omit'/);
  assert.match(sw, /ron-system-shell-v23/);
  assert.match(sw, /\/challenge-timing-view\.js/);
});
