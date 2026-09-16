import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => fs.readFile(new URL(path, root), 'utf8');

test('Challenge timing is rendered as an explicit Russian player contract, not as no deadline', async () => {
  const app = await read('public/app-v2.js');
  assert.match(app, /timing\.kind === 'CHALLENGE'/);
  assert.match(app, /Испытание до/);
  assert.match(app, /ИСПЫТАНИЕ ДО:/);
  assert.match(app, /ДО ИСПЫТАНИЯ/);
  assert.match(app, /ВОССТАНОВЛЕНИЕ:/);
  assert.match(app, /Активируется восстановление/);
  assert.match(app, /'challenge\.declared': 'Испытание принято'/);
});
