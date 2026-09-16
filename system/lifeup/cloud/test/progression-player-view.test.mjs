import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { progressionPlayerView, PROGRESSION_PLAYER_VIEW_REF } from '../src/progression-player-view.mjs';

function questBundle(id) {
  const completionId = `completion-${id}`;
  return [
    { event_id: `create-${id}`, event_type: 'quest.created', claim_status: 'derived', occurred_at: '2026-09-01T08:00:00Z', payload: { quest_id: `quest-${id}`, quest_version: 2, outcome_key: `outcome:${id}`, rank: 'D', class: 'SIDE' } },
    { event_id: completionId, event_type: 'quest.completed', claim_status: 'verified', occurred_at: '2026-09-01T09:00:00Z', payload: { quest_id: `quest-${id}` } },
    { event_id: `award-${id}`, event_type: 'progression.awarded', claim_status: 'verified', occurred_at: '2026-09-01T09:00:01Z', payload: { basis_event_id: completionId, xp: 10, coins: 0 } }
  ];
}

const verified = (ref) => ({ status: 'verified', source: 'ron-os', ref });

test('empty player projection is honest, read-only and points to first verified completion', () => {
  const view = progressionPlayerView({ events: [] });
  assert.equal(view.policy_ref, PROGRESSION_PLAYER_VIEW_REF);
  assert.equal(view.read_only, true);
  assert.equal(view.verified_quest_count, 0);
  assert.equal(view.boss.status, 'NO_CANDIDATE');
  assert.equal(view.arc.status, 'NO_CANDIDATE');
  assert.equal(view.rank.status, 'LOCKED');
  assert.equal(view.next_progression_gate, 'Заверши первый Quest v2 с проверяемым доказательством');
  assert.deepEqual(view.reward_delta, { xp: 0, coins: 0 });
  assert.equal(view.action, null);
});

test('verified outcomes become visible growth without inventing Boss or Arc eligibility', () => {
  const view = progressionPlayerView({ events: questBundle('a') });
  assert.equal(view.verified_quest_count, 1);
  assert.equal(view.visible_growth, 'Подтверждённых результатов Quest v2: 1');
  assert.equal(view.boss.status, 'NO_CANDIDATE');
  assert.equal(view.arc.status, 'NO_CANDIDATE');
  assert.equal(view.next_progression_gate, 'Продолжай накапливать подтверждённые значимые результаты');
});

test('eligible Boss and Arc candidates are surfaced but never mutate or grant rewards', () => {
  const events = [...questBundle('a'), ...questBundle('b')];
  const view = progressionPlayerView({
    events,
    boss_candidates: [{ quest_id: 'quest-a', capabilities: [verified('skill:a'), verified('skill:b')] }],
    arc_candidates: [{ milestone_id: 'arc:sample', basis_quest_ids: ['quest-a', 'quest-b'], phase_transition: verified('phase:sample') }]
  });
  assert.equal(view.boss.status, 'READY');
  assert.equal(view.boss.count, 1);
  assert.equal(view.arc.status, 'READY');
  assert.equal(view.arc.count, 1);
  assert.equal(view.rank.status, 'LOCKED');
  assert.deepEqual(view.reward_delta, { xp: 0, coins: 0 });
  assert.equal(view.action, null);
});

test('unverified candidates fail closed to player-facing NOT_READY', () => {
  const events = questBundle('a');
  const view = progressionPlayerView({
    events,
    boss_candidates: [{ quest_id: 'quest-a', capabilities: [{ status: 'reported', source: 'ron', ref: 'skill:a' }] }],
    arc_candidates: [{ milestone_id: 'arc:sample', basis_quest_ids: ['quest-a'], phase_transition: { status: 'reported', source: 'ron', ref: 'phase:sample' } }]
  });
  assert.equal(view.boss.status, 'NOT_READY');
  assert.equal(view.arc.status, 'NOT_READY');
  assert.equal(view.action, null);
});

test('progression spec keeps Boss Arc Rank writes locked while Challenge v1 is separately active', async () => {
  const spec = await readFile(new URL('../../PROGRESSION_HIERARCHY_SPEC.md', import.meta.url), 'utf8');
  assert.match(spec, /CHALLENGE WRITE ACTIVE/);
  assert.match(spec, /`challenge\.create`/);
  assert.match(spec, /persisted Boss metadata or Boss-specific write actions/);
  assert.match(spec, /Rank evolution writes or any `rank\.\*` mutation/);
  assert.match(spec, /\*\*LOCKED\*\* — persisted Boss\/Arc\/Rank\/new-Unlock transitions/);

  const view = progressionPlayerView({ events: [] });
  assert.equal(view.read_only, true);
  assert.deepEqual(view.reward_delta, { xp: 0, coins: 0 });
  assert.equal(view.action, null);
  assert.equal(view.rank.status, 'LOCKED');
});
