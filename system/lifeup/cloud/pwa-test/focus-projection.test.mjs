import test from 'node:test';
import assert from 'node:assert/strict';
import { executionFocusQuest, visibleQuests } from '../public/projection.js';

const now = new Date('2026-09-15T00:00:00Z');

function quest(id, focused) {
  return {
    id,
    quest_version: 2,
    status: 'ACTIVE',
    visibility: 'VISIBLE',
    revealed: true,
    focused,
    deadline_at: null
  };
}

test('execution focus picks the one projected focused quest among multiple open quests', () => {
  const quests = [quest('background-newer', false), quest('focused-current', true), quest('background-older', false)];
  assert.equal(visibleQuests(quests, now).length, 3);
  assert.equal(executionFocusQuest(quests, now)?.id, 'focused-current');
});

test('execution focus returns null instead of arbitrarily selecting a background open quest', () => {
  const quests = [quest('background-one', false), quest('background-two', false)];
  assert.equal(visibleQuests(quests, now).length, 2);
  assert.equal(executionFocusQuest(quests, now), null);
});
