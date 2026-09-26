import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const utility = await readFile(new URL('../public/player-utility.js', import.meta.url), 'utf8');
const shell = await readFile(new URL('../public/index-v2.html', import.meta.url), 'utf8');

test('player utility script is syntactically valid', () => {
  assert.doesNotThrow(() => new Function(utility));
});

test('current German A0 quest exposes the canonical Bebris lesson 2 execution action', () => {
  assert.match(utility, /qv2-german-a0-bebris-lesson2-20260925/);
  assert.match(utility, /https:\/\/germangalaxy\.mave\.digital\/ep-2/);
  assert.match(utility, /НАЧАТЬ УРОК БЕБРИСА/);
  assert.doesNotMatch(utility, /qv2-german-a0-bebris-lesson1-20260917/);
  assert.doesNotMatch(utility, /qv2-german-a0-first-greetings-20260917/);
  assert.doesNotMatch(utility, /qv2-german-nicos-weg-a1-hallo-recovery-20260912/);
  assert.doesNotMatch(utility, /learngerman\.dw\.com\/ru\/hallo/);
});

test('focused quest mirrors the same canonical execution action on the main Status screen', () => {
  assert.match(shell, /id="focusActions"/);
  assert.match(utility, /function enhanceFocusAction/);
  assert.match(utility, /actionForQuest\(focused\)/);
  assert.match(utility, /executionLink\(action\)/);
  assert.match(utility, /host\.replaceChildren\(executionLink\(action\)\)/);
});

test('reward and achievement notifications can open a full-screen celebration from a push deep link', () => {
  assert.match(shell, /id="celebrationDialog"/);
  assert.match(shell, /id="celebrationTitle"/);
  assert.match(shell, /id="celebrationStats"/);
  assert.match(utility, /REWARD/);
  assert.match(utility, /ACHIEVEMENT/);
  assert.match(utility, /severity[^\n]+SUCCESS/);
  assert.match(utility, /URLSearchParams\(window\.location\.search\)/);
  assert.match(utility, /params\.get\('notification'\)/);
  assert.match(utility, /params\.get\('celebrate'\)/);
  assert.match(utility, /dialog\.showModal\(\)/);
  assert.match(utility, /НАГРАДА ПОЛУЧЕНА/);
  assert.match(utility, /ДОСТИЖЕНИЕ ОТКРЫТО/);
  assert.match(utility, /ОПЫТ/);
  assert.match(utility, /МОНЕТЫ/);
});

test('celebration deep link retries a bounded DOM race instead of silently failing', () => {
  assert.match(utility, /DEEP_LINK_MAX_RETRIES = 20/);
  assert.match(utility, /deepLinkRetryCount < DEEP_LINK_MAX_RETRIES/);
  assert.match(utility, /setTimeout\(\(\) => \{/);
  assert.match(utility, /void enhance\(\)/);
  assert.match(utility, /75/);
});

test('stale marketplace evidence cannot keep a decorative confirmed level', () => {
  assert.match(utility, /marketplace-operations/);
  assert.match(utility, /4 months/);
  assert.match(utility, /УРОВЕНЬ НЕ ПОДТВЕРЖДЁН/);
  assert.match(utility, /Предыдущая завышенная оценка отменена/);
  assert.doesNotMatch(utility, /Tier 3/);
});

test('strategy navigation is demoted and player utility module is loaded', () => {
  assert.match(utility, /КАРТА СТРАТЕГИИ/);
  assert.match(shell, /player-utility\.js/);
});
