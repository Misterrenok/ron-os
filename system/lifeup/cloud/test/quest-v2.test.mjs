import test from 'node:test';
import assert from 'node:assert/strict';
import { actionToEvent, buildSnapshot, validateEventAgainstHistory } from '../src/quest-v2.mjs';

const context = { actor: 'chatgpt', source: 'quest-v2-test', sourceRef: 'ci:quest-v2' };

function eventFor(action) {
  return actionToEvent(action, context);
}

function append(events, action, occurredAt = new Date().toISOString()) {
  const event = eventFor(action);
  validateEventAgainstHistory(event, events);
  event.occurred_at = occurredAt;
  events.push(event);
  return event;
}

test('Quest v1 events remain visible objective-free one-shot quests', () => {
  const events = [];
  append(events, { type: 'quest.create', payload: { quest_id: 'legacy-q', title: 'Legacy', class: 'SIDE', rank: 'E' } });
  let snapshot = buildSnapshot(events);
  assert.equal(snapshot.quests[0].quest_version, 1);
  assert.equal(snapshot.quests[0].visibility, 'VISIBLE');
  assert.equal(snapshot.quests[0].revealed, true);
  assert.deepEqual(snapshot.quests[0].objectives, []);

  append(events, {
    type: 'quest.complete',
    payload: { quest_id: 'legacy-q', evidence: { status: 'reported', source: 'ron', ref: 'legacy-report' } }
  });
  snapshot = buildSnapshot(events);
  assert.equal(snapshot.quests[0].status, 'COMPLETED');
});


test('Quest v2 allows multiple open quests while exactly one owns execution focus', () => {
  const events = [];
  append(events, { type: 'quest.create', payload: { quest_id: 'legacy-probe', title: 'Legacy probe', class: 'SIDE', rank: 'E' } });
  append(events, { type: 'quest.create', payload: { quest_id: 'player-one', quest_version: 2, title: 'Player one', objectives: [] } });
  append(events, { type: 'quest.create', payload: { quest_id: 'player-two', quest_version: 2, title: 'Player two', objectives: [] } });

  let snapshot = buildSnapshot(events);
  const playerOne = snapshot.quests.find((q) => q.id === 'player-one');
  const playerTwo = snapshot.quests.find((q) => q.id === 'player-two');
  assert.equal(playerOne.status, 'ACTIVE');
  assert.equal(playerTwo.status, 'ACTIVE');
  assert.equal(snapshot.open_quest_count, 2);
  assert.equal(snapshot.focused_quest_id, 'player-one');
  assert.equal(snapshot.focus_source, 'LEGACY_IMPLICIT');
  assert.equal(playerOne.focus_state, 'FOCUSED');
  assert.equal(playerTwo.focus_state, 'BACKGROUND');

  append(events, { type: 'quest.focus', payload: { quest_id: 'player-two', reason: 'higher-value execution target' } });
  snapshot = buildSnapshot(events);
  assert.equal(snapshot.focused_quest_id, 'player-two');
  assert.equal(snapshot.focus_source, 'EXPLICIT');
  assert.equal(snapshot.quests.find((q) => q.id === 'player-one').focus_state, 'BACKGROUND');
  assert.equal(snapshot.quests.find((q) => q.id === 'player-two').focus_state, 'FOCUSED');

  assert.throws(() => validateEventAgainstHistory(eventFor({
    type: 'quest.focus', payload: { quest_id: 'player-two', reason: 'duplicate focus' }
  }), events), /quest is already focused/);

  assert.throws(() => validateEventAgainstHistory(eventFor({
    type: 'quest.focus', payload: { quest_id: 'legacy-probe', reason: 'invalid legacy target' }
  }), events), /Quest v2/);

  append(events, { type: 'quest.fail', payload: { quest_id: 'player-two', reason: 'terminalize focused quest' } });
  snapshot = buildSnapshot(events);
  assert.equal(snapshot.focused_quest_id, null);
  assert.equal(snapshot.focus_required, true);
  assert.equal(snapshot.quests.find((q) => q.id === 'player-one').focus_state, 'BACKGROUND');

  append(events, { type: 'quest.focus', payload: { quest_id: 'player-one', reason: 're-evaluated next focus' } });
  snapshot = buildSnapshot(events);
  assert.equal(snapshot.focused_quest_id, 'player-one');
  assert.equal(snapshot.focus_required, false);
});

test('Quest v2 enforces objective progress and terminal lifecycle', () => {
  const events = [];
  append(events, {
    type: 'quest.create',
    payload: {
      quest_id: 'qv2-main',
      quest_version: 2,
      title: 'Structured quest',
      class: 'MAIN',
      rank: 'E',
      visibility: 'HIDDEN',
      deadline_at: '2099-01-01T00:00:00Z',
      objectives: [
        { objective_id: 'sessions', title: 'Study sessions', target: 5, unit: 'sessions', required: true },
        { objective_id: 'check', title: 'Recall check', target: 1, unit: 'check', required: true }
      ]
    }
  });

  let snapshot = buildSnapshot(events);
  let quest = snapshot.quests[0];
  assert.equal(quest.quest_version, 2);
  assert.equal(quest.visibility, 'HIDDEN');
  assert.equal(quest.revealed, false);
  assert.equal(quest.objectives[0].progress, 0);

  assert.throws(() => validateEventAgainstHistory(eventFor({
    type: 'quest.complete',
    payload: { quest_id: 'qv2-main', evidence: { status: 'verified', source: 'test', ref: 'premature' } }
  }), events), /required objectives are incomplete/);

  append(events, {
    type: 'quest.progress',
    payload: { quest_id: 'qv2-main', objective_id: 'sessions', value: 3, evidence: { status: 'reported', source: 'ron', ref: '3-sessions' } }
  });

  assert.throws(() => validateEventAgainstHistory(eventFor({
    type: 'quest.progress',
    payload: { quest_id: 'qv2-main', objective_id: 'sessions', value: 3, evidence: { status: 'reported', source: 'ron' } }
  }), events), /progress must strictly increase/);

  assert.throws(() => validateEventAgainstHistory(eventFor({
    type: 'quest.progress',
    payload: { quest_id: 'qv2-main', objective_id: 'sessions', value: 6, evidence: { status: 'reported', source: 'ron' } }
  }), events), /progress cannot exceed objective target/);

  append(events, {
    type: 'quest.reveal',
    payload: { quest_id: 'qv2-main', reason: 'Trigger reached' }
  });
  append(events, {
    type: 'quest.progress',
    payload: { quest_id: 'qv2-main', objective_id: 'sessions', value: 5, evidence: { status: 'verified', source: 'test', ref: 'sessions-complete' } }
  });
  append(events, {
    type: 'quest.progress',
    payload: { quest_id: 'qv2-main', objective_id: 'check', value: 1, evidence: { status: 'verified', source: 'test', ref: 'check-complete' } }
  });
  append(events, {
    type: 'quest.complete',
    payload: { quest_id: 'qv2-main', evidence: { status: 'verified', source: 'test', ref: 'all-objectives' } }
  });

  snapshot = buildSnapshot(events);
  quest = snapshot.quests[0];
  assert.equal(quest.revealed, true);
  assert.equal(quest.status, 'COMPLETED');
  assert.equal(quest.objectives[0].progress, 5);
  assert.equal(quest.objectives[1].progress, 1);

  assert.throws(() => validateEventAgainstHistory(eventFor({
    type: 'quest.fail',
    payload: { quest_id: 'qv2-main', reason: 'too late' }
  }), events), /quest is not active: COMPLETED/);
});

test('failed and expired Quest v2 quests cannot later complete', () => {
  const events = [];
  append(events, {
    type: 'quest.create',
    payload: { quest_id: 'q-fail', quest_version: 2, title: 'Fail path', objectives: [] }
  });
  append(events, { type: 'quest.fail', payload: { quest_id: 'q-fail', reason: 'explicit failure' } });
  assert.throws(() => validateEventAgainstHistory(eventFor({
    type: 'quest.complete',
    payload: { quest_id: 'q-fail', evidence: { status: 'verified', source: 'test', ref: 'invalid' } }
  }), events), /quest is not active: FAILED/);

  append(events, {
    type: 'quest.create',
    payload: {
      quest_id: 'q-expire',
      quest_version: 2,
      title: 'Expired path',
      deadline_at: '2000-01-01T00:00:00Z',
      objectives: []
    }
  });
  append(events, { type: 'quest.expire', payload: { quest_id: 'q-expire', reason: 'deadline passed' } });
  const snapshot = buildSnapshot(events);
  const expired = snapshot.quests.find((q) => q.id === 'q-expire');
  assert.equal(expired.status, 'EXPIRED');

  assert.throws(() => validateEventAgainstHistory(eventFor({
    type: 'quest.complete',
    payload: { quest_id: 'q-expire', evidence: { status: 'verified', source: 'test', ref: 'invalid' } }
  }), events), /quest is not active: EXPIRED/);
});

test('Quest v2 expiration cannot happen before deadline', () => {
  const events = [];
  append(events, {
    type: 'quest.create',
    payload: {
      quest_id: 'q-future',
      quest_version: 2,
      title: 'Future deadline',
      deadline_at: '2099-01-01T00:00:00Z',
      objectives: []
    }
  });
  assert.throws(() => validateEventAgainstHistory(eventFor({
    type: 'quest.expire',
    payload: { quest_id: 'q-future', reason: 'premature' }
  }), events), /quest deadline has not passed/);
});
