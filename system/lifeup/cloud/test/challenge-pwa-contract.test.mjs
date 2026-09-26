import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => fs.readFile(new URL(path, root), 'utf8');

test('Challenge timing is rendered as an explicit Russian player contract, not as no deadline', async () => {
  const [app, helper] = await Promise.all([
    read('public/app-v2.js'),
    read('public/challenge-timing-view.js')
  ]);

  assert.match(app, /challengeTimingRows\(timing, formatDate\)/);
  assert.match(app, /challengeFocusCopy\(timing, status, formatDate\)/);
  assert.match(app, /'challenge\.declared': 'Испытание принято'/);

  assert.match(helper, /timing\?\.kind !== 'CHALLENGE'/);
  assert.match(helper, /Испытание до/);
  assert.match(helper, /ИСПЫТАНИЕ ДО:/);
  assert.match(helper, /ДО ИСПЫТАНИЯ/);
  assert.match(helper, /ВОССТАНОВЛЕНИЕ:/);
  assert.match(helper, /СТАВКА: НАГРАДА \+ СЕРИЯ/);
  assert.match(helper, /Ставка при промахе/);
  assert.match(helper, /серия рвётся/);
});
