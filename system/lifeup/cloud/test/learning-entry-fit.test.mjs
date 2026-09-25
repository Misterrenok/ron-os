import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const policy = await readFile(new URL('../../QUEST_DIFFICULTY_SPEC.md', import.meta.url), 'utf8');
const utility = await readFile(new URL('../public/player-utility.js', import.meta.url), 'utf8');

test('learning quests require verified entry fit before scoring or creation', () => {
  assert.match(policy, /current verified baseline/);
  assert.match(policy, /real prerequisites/);
  assert.match(policy, /instruction\/interface language/);
  assert.match(policy, /concrete independently valuable capability outcome/);
  assert.match(policy, /strategic course\/track label or XMind alignment alone never proves/);
});

test('zero-baseline entry fit checks actual instructional comprehensibility, not localized shell', () => {
  assert.match(policy, /actual instructional content is comprehensible/);
  assert.match(policy, /not merely that the page\/UI is localized/);
  assert.match(policy, /target-language-only immersion is supporting practice only after the relevant material has been introduced/);
  assert.match(policy, /localized shell around otherwise incomprehensible target-language content does not satisfy entry fit/);
});

test('current German A0 quest routes to Alexander Bebris lesson 2', () => {
  assert.match(utility, /qv2-german-a0-bebris-lesson2-20260925/);
  assert.match(utility, /https:\/\/germangalaxy\.mave\.digital\/ep-2/);
  assert.match(utility, /НАЧАТЬ УРОК БЕБРИСА/);
  assert.doesNotMatch(utility, /qv2-german-a0-bebris-lesson1-20260917/);
  assert.doesNotMatch(utility, /qv2-german-a0-first-greetings-20260917/);
  assert.doesNotMatch(utility, /learngerman\.dw\.com\/ru\/hallo/);
  assert.doesNotMatch(utility, /qv2-german-nicos-weg-a1-hallo-recovery-20260912/);
});
