import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const utility = await readFile(new URL('../public/player-utility.js', import.meta.url), 'utf8');
const shell = await readFile(new URL('../public/index-v2.html', import.meta.url), 'utf8');

test('player utility script is syntactically valid after stripping its module import', () => {
  const body = utility.replace(/^import .*;\n/gm, '');
  assert.doesNotThrow(() => new Function(body));
});

test('player utility uses generic Quest execution routing with no current-quest whitelist', () => {
  assert.match(utility, /import \{ questExecutionAction \} from '\.\/quest-execution-action\.js'/);
  assert.match(utility, /return questExecutionAction\(quest\)/);
  assert.doesNotMatch(utility, /qv2-german-a0-bebris-lesson3-20260926/);
  assert.doesNotMatch(utility, /d_bW8YApWac/);
  assert.doesNotMatch(utility, /GERMAN_A0_QUEST_ID|GERMAN_A0_URL/);
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
  assert.match(utility, /ПОВЫШЕНИЕ УРОВНЯ/);
  assert.match(utility, /levelUpTransition/);
  assert.match(utility, /classList\.toggle\('level-up'/);
  assert.match(utility, /НАГРАДА ПОЛУЧЕНА/);
  assert.match(utility, /ЭВОЛЮЦИЯ НАВЫКА/);
  assert.match(utility, /ХАРАКТЕРИСТИКА ПОВЫШЕНА/);
  assert.match(utility, /СКАН РОСТА/);
  assert.match(utility, /celebration-growth/);
  assert.match(utility, /ДОСТИЖЕНИЕ ОТКРЫТО/);
  assert.match(utility, /ОПЫТ/);
  assert.match(utility, /МОНЕТЫ/);
});

test('celebrations project historical reward progression against the current profile', () => {
  assert.match(utility, /import \{ truthfulRewardNotification \} from '\.\/notification-truth\.js'/);
  assert.match(utility, /truthfulRewardNotification\(notification, profile\)/);
  assert.match(utility, /showCelebration\(playerNotification\)/);
  assert.match(utility, /enhanceNotification\(notification, state\.profile\)/);
  assert.match(utility, /maybeOpenDeepLinkedNotification\(state\.notifications \|\| \[\], state\.profile\)/);
});

test('celebration deep link retries a bounded DOM race instead of silently failing', () => {
  assert.match(utility, /DEEP_LINK_MAX_RETRIES = 20/);
  assert.match(utility, /deepLinkRetryCount < DEEP_LINK_MAX_RETRIES/);
  assert.match(utility, /setTimeout\(\(\) => \{/);
  assert.match(utility, /void enhance\(\)/);
  assert.match(utility, /75/);
});

test('skill player surface separates Mastery from evidence-backed competence', () => {
  assert.match(utility, /system-skill-mastery:v1/);
  assert.match(utility, /КОМПЕТЕНТНОСТЬ НЕ ПОДТВЕРЖДЕНА/);
  assert.match(utility, /МАСТЕРСТВО/);
  assert.match(utility, /Мастерство: ур\./);
  assert.match(utility, /не является CEFR/);
  assert.match(utility, /mastery_tracked === true/);
  assert.match(utility, /Пока не отслеживается: ещё нет задания Системы/);
  assert.match(utility, /growthReadinessPlayerView\(skill\)/);
  assert.match(utility, /growth-readiness\.js/);
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
