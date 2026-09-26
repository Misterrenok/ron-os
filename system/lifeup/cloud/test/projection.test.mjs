import test from 'node:test';
import assert from 'node:assert/strict';
import { playerQuestCounts, questDisplayStatus, questObjectiveProgress, questTiming, visibleQuests, xpLevelProgress } from '../public/projection.js';

test('XP bar uses server-projected level-local XP and is independent of curve formula', () => {
  assert.equal(xpLevelProgress({
    level: 1, xp: 0, xp_to_next: 100,
    current_level_floor_xp: 0, level_span_xp: 100, xp_into_level: 0
  }).percent, 0);
  assert.equal(xpLevelProgress({
    level: 1, xp: 50, xp_to_next: 50,
    current_level_floor_xp: 0, level_span_xp: 100, xp_into_level: 50
  }).percent, 50);
  const level2 = xpLevelProgress({
    level: 2, xp: 125, xp_to_next: 85,
    current_level_floor_xp: 100, level_span_xp: 110, xp_into_level: 25
  });
  assert.equal(level2.into_level, 25);
  assert.equal(level2.level_span, 110);
  assert.equal(level2.percent, 25 / 110 * 100);
});

test('active player projection excludes hidden, legacy probe and terminal quest residue', () => {
  const now = Date.parse('2026-09-12T00:00:00Z');
  const quests = [
    { id: 'active', quest_version: 2, visibility: 'VISIBLE', status: 'ACTIVE', deadline_at: '2099-01-01T00:00:00Z' },
    { id: 'hidden', quest_version: 2, visibility: 'HIDDEN', revealed: false, status: 'ACTIVE' },
    { id: 'revealed', quest_version: 2, visibility: 'HIDDEN', revealed: true, status: 'ACTIVE' },
    { id: 'legacy-probe', quest_version: 1, visibility: 'VISIBLE', status: 'ACTIVE' },
    { id: 'expired', quest_version: 2, visibility: 'VISIBLE', status: 'EXPIRED' },
    { id: 'cancelled', quest_version: 2, visibility: 'VISIBLE', status: 'CANCELLED' },
    { id: 'completed', quest_version: 2, visibility: 'VISIBLE', status: 'COMPLETED' }
  ];
  assert.deepEqual(visibleQuests(quests, now).map((q) => q.id), ['active', 'revealed']);
});

test('objective summary counts required objectives only', () => {
  assert.deepEqual(questObjectiveProgress({ objectives: [
    { target: 5, progress: 5, required: true },
    { target: 1, progress: 0, required: true },
    { target: 2, progress: 0, required: false }
  ] }), { completed: 1, total: 2 });
});

test('overdue projection is immediate but does not rewrite ledger state', () => {
  const quest = { quest_version: 2, visibility: 'VISIBLE', status: 'ACTIVE', deadline_at: '2026-09-11T16:30:00Z' };
  assert.equal(questDisplayStatus(quest, Date.parse('2026-09-11T16:29:59Z')), 'ACTIVE');
  assert.equal(questDisplayStatus(quest, Date.parse('2026-09-11T16:30:00Z')), 'OVERDUE');
  assert.equal(quest.status, 'ACTIVE');
});

test('recommended windows reuse the compatible SOFT transport only before the window', () => {
  const before = Date.parse('2026-09-12T18:00:00Z');
  const atWindow = Date.parse('2026-09-12T18:30:00Z');
  const recommended = { recommended_window_at: '2026-09-12T18:30:00Z' };
  const legacy = { soft_target_at: '2026-09-12T18:30:00Z' };
  assert.deepEqual(questTiming(recommended, before), { kind: 'SOFT', at: '2026-09-12T18:30:00Z', passed: false });
  assert.deepEqual(questTiming(legacy, before), { kind: 'SOFT', at: '2026-09-12T18:30:00Z', passed: false });
  assert.deepEqual(questTiming(recommended, atWindow), { kind: 'NONE', at: null, passed: false });
  assert.deepEqual(questTiming(legacy, atWindow), { kind: 'NONE', at: null, passed: false });
});

test('Challenge timing is distinct from a hard external deadline and exposes only player-useful recovery copy', () => {
  const quest = {
    timing_mode: 'CHALLENGE',
    deadline_at: '2026-09-12T19:00:00Z',
    challenge_contract: {
      contract_id: '55555555-5555-4555-8555-555555555555',
      recovery_title: 'Вернуться коротким шагом'
    }
  };
  assert.deepEqual(questTiming(quest, Date.parse('2026-09-12T18:30:00Z')), {
    kind: 'CHALLENGE',
    at: '2026-09-12T19:00:00Z',
    passed: false,
    recovery_title: 'Вернуться коротким шагом'
  });
  const passed = questTiming(quest, Date.parse('2026-09-12T19:00:00Z'));
  assert.equal(passed.kind, 'CHALLENGE');
  assert.equal(passed.passed, true);
  assert.equal('contract_id' in passed, false);
});

test('hard deadlines take precedence over recommendation metadata', () => {
  const now = Date.parse('2026-09-12T18:30:00Z');
  assert.deepEqual(questTiming({ recommended_window_at: '2026-09-12T18:30:00Z', deadline_at: '2026-09-12T19:00:00Z' }, now), {
    kind: 'HARD', at: '2026-09-12T19:00:00Z', passed: false
  });
  assert.deepEqual(questTiming({}, now), { kind: 'NONE', at: null, passed: false });
});

test('player quest counters exclude legacy and terminal residue and distinguish overdue', () => {
  const counts = playerQuestCounts([
    { quest_version: 1, visibility: 'VISIBLE', status: 'ACTIVE' },
    { quest_version: 2, visibility: 'VISIBLE', status: 'EXPIRED' },
    { quest_version: 2, visibility: 'VISIBLE', status: 'CANCELLED' },
    { quest_version: 2, visibility: 'VISIBLE', status: 'ACTIVE', deadline_at: '2099-01-01T00:00:00Z' },
    { quest_version: 2, visibility: 'VISIBLE', status: 'ACTIVE', deadline_at: '2000-01-01T00:00:00Z' }
  ], Date.parse('2026-09-11T00:00:00Z'));
  assert.deepEqual(counts, { active: 1, overdue: 1 });
});
