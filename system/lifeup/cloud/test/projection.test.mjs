import test from 'node:test';
import assert from 'node:assert/strict';
import { questObjectiveProgress, visibleQuests, xpLevelProgress } from '../public/projection.js';

test('XP bar uses level-local XP rather than cumulative XP divided by XP-to-next', () => {
  assert.equal(xpLevelProgress({ level: 1, xp: 0, xp_to_next: 500 }).percent, 0);
  assert.equal(xpLevelProgress({ level: 1, xp: 250, xp_to_next: 250 }).percent, 50);

  const level2 = xpLevelProgress({ level: 2, xp: 750, xp_to_next: 750 });
  assert.equal(level2.into_level, 250);
  assert.equal(level2.level_span, 1000);
  assert.equal(level2.percent, 25);
});

test('unrevealed hidden quests are suppressed from player projection', () => {
  const quests = [
    { id: 'visible', visibility: 'VISIBLE', revealed: true },
    { id: 'hidden', visibility: 'HIDDEN', revealed: false },
    { id: 'revealed', visibility: 'HIDDEN', revealed: true },
    { id: 'legacy' }
  ];
  assert.deepEqual(visibleQuests(quests).map((q) => q.id), ['visible', 'revealed', 'legacy']);
});

test('objective summary counts required objectives only', () => {
  const summary = questObjectiveProgress({
    objectives: [
      { target: 5, progress: 5, required: true },
      { target: 1, progress: 0, required: true },
      { target: 2, progress: 0, required: false }
    ]
  });
  assert.deepEqual(summary, { completed: 1, total: 2 });
});
