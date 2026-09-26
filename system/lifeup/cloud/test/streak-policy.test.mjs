import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveExecutionStreak, STREAK_POLICY_REF } from '../src/streak-policy.mjs';

const questCreated = (id='q1', at='2026-09-25T15:00:00Z') => ({
  event_type:'quest.created', occurred_at:at, claim_status:'derived',
  payload:{quest_id:id,quest_version:2,visibility:'VISIBLE',class:'MAIN'}
});
const reminder = (id, questId, at) => ({
  event_type:'reminder.scheduled',occurred_at:'2026-09-26T03:00:00Z',source_ref:'system-execution-reminder:v1:execution-window',
  payload:{schedule_id:id,quest_id:questId,remind_at:at}
});
const progress = (questId, at) => ({
  event_type:'quest.progressed',occurred_at:at,claim_status:'verified',payload:{quest_id:questId}
});

test('planned execution day stays at risk until verified execution arrives', () => {
  const events=[questCreated(),reminder('r1','q1','2026-09-26T16:35:00Z')];
  const streak=deriveExecutionStreak(events,{now:'2026-09-26T07:00:00+03:00'});
  assert.equal(streak.policy_ref, STREAK_POLICY_REF);
  assert.equal(streak.current,0);
  assert.equal(streak.status,'AT_RISK_TODAY');
  assert.equal(streak.history.misses,0);
});

test('verified progress secures a planned day and extends streak', () => {
  const events=[
    questCreated(),
    reminder('r1','q1','2026-09-26T16:35:00Z'),
    progress('q1','2026-09-26T18:00:00+03:00'),
    reminder('r2','q1','2026-09-27T06:10:00Z'),
    progress('q1','2026-09-27T10:00:00+03:00')
  ];
  const streak=deriveExecutionStreak(events,{now:'2026-09-27T12:00:00+03:00'});
  assert.equal(streak.current,2);
  assert.equal(streak.best,2);
  assert.equal(streak.status,'SECURED_TODAY');
  assert.equal(streak.next_milestone,3);
});

test('a missed planned execution day breaks current streak but preserves best', () => {
  const events=[
    questCreated(),
    reminder('r1','q1','2026-09-26T16:35:00Z'),
    progress('q1','2026-09-26T18:00:00+03:00'),
    reminder('r2','q1','2026-09-27T06:10:00Z'),
    reminder('r3','q1','2026-09-28T06:10:00Z'),
    progress('q1','2026-09-28T10:00:00+03:00')
  ];
  const streak=deriveExecutionStreak(events,{now:'2026-09-28T12:00:00+03:00'});
  assert.equal(streak.current,1);
  assert.equal(streak.best,1);
  assert.equal(streak.history.misses,1);
});

test('Challenge expiry forces a streak break even if another quest progressed that day', () => {
  const events=[
    questCreated('q1'),
    questCreated('q2'),
    {event_type:'challenge.declared',occurred_at:'2026-09-26T03:00:00Z',payload:{quest_id:'q1',deadline_at:'2026-09-26T19:00:00+03:00'}},
    progress('q2','2026-09-26T18:00:00+03:00'),
    {event_type:'quest.expired',occurred_at:'2026-09-26T19:01:00+03:00',payload:{quest_id:'q1'}}
  ];
  const streak=deriveExecutionStreak(events,{now:'2026-09-26T20:00:00+03:00'});
  assert.equal(streak.current,0);
  assert.equal(streak.status,'BROKEN_TODAY');
  assert.equal(streak.pressure.challenge_missed,1);
});

test('future reminder stops creating liability when its quest completed before the reminder time', () => {
  const events=[
    questCreated(),
    reminder('r1','q1','2026-09-27T06:10:00Z'),
    {event_type:'quest.completed',occurred_at:'2026-09-26T18:00:00+03:00',claim_status:'verified',payload:{quest_id:'q1'}}
  ];
  const streak=deriveExecutionStreak(events,{now:'2026-09-27T12:00:00+03:00'});
  assert.equal(streak.status,'NO_PLANNED_EXECUTION_TODAY');
  assert.equal(streak.history.misses,0);
});

test('future Challenge deadline stops creating liability when Challenge completed early', () => {
  const events=[
    questCreated(),
    {event_type:'challenge.declared',occurred_at:'2026-09-26T03:00:00Z',payload:{quest_id:'q1',deadline_at:'2026-09-27T19:00:00+03:00'}},
    {event_type:'quest.completed',occurred_at:'2026-09-26T18:00:00+03:00',claim_status:'verified',payload:{quest_id:'q1'}}
  ];
  const streak=deriveExecutionStreak(events,{now:'2026-09-27T20:00:00+03:00'});
  assert.equal(streak.status,'NO_PLANNED_EXECUTION_TODAY');
  assert.equal(streak.history.misses,0);
});

test('protected interruption preserves streak without extending it', () => {
  const events=[
    questCreated(),
    reminder('r1','q1','2026-09-26T16:35:00Z'),
    progress('q1','2026-09-26T18:00:00+03:00'),
    reminder('r2','q1','2026-09-27T06:10:00Z'),
    {event_type:'streak.excused',occurred_at:'2026-09-27T07:00:00+03:00',claim_status:'derived',payload:{policy_ref:'system-execution-streak:v1',local_date:'2026-09-27',reason_code:'ILLNESS',reason:'illness'}}
  ];
  const streak=deriveExecutionStreak(events,{now:'2026-09-27T20:00:00+03:00'});
  assert.equal(streak.current,1);
  assert.equal(streak.best,1);
  assert.equal(streak.status,'EXCUSED_TODAY');
  assert.equal(streak.history.excused,1);
  assert.equal(streak.history.misses,0);
});

test('protected interruption neutralizes Challenge streak break but does not create a win', () => {
  const events=[
    questCreated(),
    reminder('r0','q1','2026-09-25T16:00:00Z'),
    progress('q1','2026-09-26T08:00:00+03:00'),
    {event_type:'challenge.declared',occurred_at:'2026-09-26T09:00:00+03:00',payload:{quest_id:'q1',deadline_at:'2026-09-27T19:00:00+03:00'}},
    {event_type:'quest.expired',occurred_at:'2026-09-27T19:01:00+03:00',payload:{quest_id:'q1'}},
    {event_type:'streak.excused',occurred_at:'2026-09-27T19:05:00+03:00',claim_status:'derived',payload:{policy_ref:'system-execution-streak:v1',local_date:'2026-09-27',reason_code:'EXTERNAL_DISRUPTION',reason:'material disruption'}}
  ];
  const streak=deriveExecutionStreak(events,{now:'2026-09-27T20:00:00+03:00'});
  assert.equal(streak.status,'EXCUSED_TODAY');
  assert.equal(streak.current,1);
  assert.equal(streak.history.misses,0);
  assert.equal(streak.history.excused,1);
});

test('technical live push proof reminders never create streak obligations', () => {
  const events=[questCreated(),{
    event_type:'reminder.scheduled',occurred_at:'2026-09-26T03:00:00Z',source_ref:'system-execution-reminder:v1:live-proof',
    payload:{schedule_id:'live-push-proof-1',quest_id:'q1',remind_at:'2026-09-26T06:00:00Z'}
  }];
  const streak=deriveExecutionStreak(events,{now:'2026-09-26T12:00:00+03:00'});
  assert.equal(streak.status,'NO_PLANNED_EXECUTION_TODAY');
});
