import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const policy = await readFile(new URL('../../QUEST_DIFFICULTY_SPEC.md', import.meta.url), 'utf8');
const utility = await readFile(new URL('../public/player-utility.js', import.meta.url), 'utf8');
const execution = await readFile(new URL('../public/quest-execution-action.js', import.meta.url), 'utf8');

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

test('learning execution routing is generic instead of tied to one German lesson id', () => {
  assert.match(utility, /questExecutionAction/);
  assert.match(execution, /урок\|lesson\|бебрис\|bebris\|nicos/);
  assert.match(execution, /НАЧАТЬ УРОК/);
  assert.doesNotMatch(utility, /qv2-german-a0-bebris-lesson3-20260926/);
  assert.doesNotMatch(utility, /d_bW8YApWac/);
  assert.doesNotMatch(utility, /learngerman\.dw\.com\/ru\/hallo/);
});
