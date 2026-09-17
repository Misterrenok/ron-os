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

test('current German A0 quest routes only to the Russian DW beginner surface', () => {
  assert.match(utility, /qv2-german-a0-first-greetings-20260917/);
  assert.match(utility, /https:\/\/learngerman\.dw\.com\/ru\/hallo\/l-37250531/);
  assert.doesNotMatch(utility, /qv2-german-nicos-weg-a1-hallo-recovery-20260912/);
  assert.doesNotMatch(utility, /learngerman\.dw\.com\/en\/hallo/);
});
