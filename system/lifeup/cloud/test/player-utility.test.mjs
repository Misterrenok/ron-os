import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const utility = await readFile(new URL('../public/player-utility.js', import.meta.url), 'utf8');
const shell = await readFile(new URL('../public/index-v2.html', import.meta.url), 'utf8');

test('Hallo quest exposes the canonical DW execution action', () => {
  assert.match(utility, /qv2-german-nicos-weg-a1-hallo-recovery-20260912/);
  assert.match(utility, /https:\/\/learngerman\.dw\.com\/en\/hallo\/l-37250531/);
  assert.match(utility, /НАЧАТЬ УРОК/);
});

test('stale marketplace evidence cannot keep a decorative confirmed level', () => {
  assert.match(utility, /marketplace-operations/);
  assert.match(utility, /4 months/);
  assert.match(utility, /УРОВЕНЬ НЕ ПОДТВЕРЖДЁН/);
  assert.match(utility, /стаж сам по себе уровень не повышает/);
});

test('strategy navigation is demoted and player utility module is loaded', () => {
  assert.match(utility, /КАРТА СТРАТЕГИИ/);
  assert.match(shell, /player-utility\.js/);
});
