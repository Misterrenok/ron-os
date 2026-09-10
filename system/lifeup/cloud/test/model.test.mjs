import test from 'node:test';
import assert from 'node:assert/strict';
import { actionToEvent, buildSnapshot, emptyState, reduceEvent, validateEventAgainstHistory } from '../src/model.mjs';

test('empty System is explicitly uncalibrated instead of inventing current progression', () => {
  const state = emptyState();
  assert.equal(state.profile.initialized, false);
  assert.equal(state.profile.level, null);
  assert.equal(state.profile.rank, null);
  assert.equal(state.profile.economy_status, 'UNCALIBRATED');
  assert.deepEqual(state.skills, []);
});

test('quest completion can be reported without becoming verified execution', () => {
  const created = actionToEvent({ type: 'quest.create', payload: { title: 'Test quest', class: 'SIDE', rank: 'E' } });
  created.occurred_at = new Date().toISOString();
  const complete = actionToEvent({
    type: 'quest.complete',
    payload: { quest_id: created.payload.quest_id, evidence: { status: 'reported', source: 'ron' } }
  });
  complete.occurred_at = new Date().toISOString();
  const state = buildSnapshot([created, complete]);
  assert.equal(state.quests[0].status, 'COMPLETED');
  assert.equal(state.quests[0].completion_claim, 'REPORTED');
  assert.equal(state.profile.xp, 0);
  assert.equal(state.profile.coins, 0);
});

test('progression award rejects non-verified evidence', () => {
  assert.throws(() => actionToEvent({
    type: 'progression.award',
    payload: {
      xp: 10,
      basis_event_id: 'event-123',
      evidence: { status: 'reported', source: 'ron' }
    }
  }), /verified evidence is required/);
});

test('verified progression mutates only derived game totals', () => {
  const award = actionToEvent({
    type: 'progression.award',
    payload: {
      xp: 10,
      coins: 3,
      basis_event_id: 'event-123',
      evidence: { status: 'verified', source: 'live-owner', ref: 'owner:event-123' }
    }
  });
  award.occurred_at = new Date().toISOString();
  const state = reduceEvent(emptyState(), award);
  assert.equal(state.profile.xp, 10);
  assert.equal(state.profile.coins, 3);
  assert.equal(state.profile.level, null);
});

test('terminal quest transitions require an existing active quest', () => {
  const complete = actionToEvent({ type: 'quest.complete', payload: { quest_id: 'missing', evidence: { status: 'reported', source: 'ron' } } });
  assert.throws(() => validateEventAgainstHistory(complete, []), /quest does not exist/);
});

test('progression requires an existing verified completion basis and cannot double-award', () => {
  const created = actionToEvent({ type: 'quest.create', payload: { title: 'Verified quest' } });
  created.occurred_at = new Date().toISOString();
  const complete = actionToEvent({ type: 'quest.complete', payload: { quest_id: created.payload.quest_id, evidence: { status: 'verified', source: 'live-owner', ref: 'owner:1' } } });
  complete.occurred_at = new Date().toISOString();
  validateEventAgainstHistory(complete, [created]);
  const award = actionToEvent({ type: 'progression.award', payload: { xp: 4, basis_event_id: complete.event_id, evidence: { status: 'verified', source: 'live-owner', ref: 'owner:1' } } });
  assert.doesNotThrow(() => validateEventAgainstHistory(award, [created, complete]));
  award.occurred_at = new Date().toISOString();
  const second = actionToEvent({ type: 'progression.award', payload: { coins: 1, basis_event_id: complete.event_id, evidence: { status: 'verified', source: 'live-owner', ref: 'owner:1' } } });
  assert.throws(() => validateEventAgainstHistory(second, [created, complete, award]), /already awarded/);
});
