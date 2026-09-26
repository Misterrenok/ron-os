import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateChallengeAdmission, pressureProfileStatus, PRESSURE_PROFILE_REF } from '../src/pressure-profile.mjs';

const declaration=(seq,id,at)=>({seq,event_type:'challenge.declared',occurred_at:at,payload:{quest_id:id}});
const terminal=(seq,id,type,at)=>({seq,event_type:type,occurred_at:at,payload:{quest_id:id}});
const normalized={quest:{quest_id:'new',class:'MAIN',reward_xp:10}};

test('standing pressure profile starts open but bounded',()=>{
  const status=pressureProfileStatus([],{now:'2026-09-26T10:00:00+03:00'});
  assert.equal(status.policy_ref,PRESSURE_PROFILE_REF);
  assert.equal(status.review_required,false);
  assert.equal(evaluateChallengeAdmission([],normalized,{now:'2026-09-26T10:00:00+03:00'}).allowed,true);
});

test('only one active Challenge may exist',()=>{
  const events=[declaration(1,'q1','2026-09-26T08:00:00Z')];
  const result=evaluateChallengeAdmission(events,normalized,{now:'2026-09-26T12:00:00Z'});
  assert.equal(result.allowed,false);
  assert.match(result.reasons.join(' '),/only one active/);
});

test('standing profile caps Challenge starts at two per rolling seven days',()=>{
  const events=[
    declaration(1,'q1','2026-09-24T08:00:00Z'),terminal(2,'q1','quest.completed','2026-09-24T09:00:00Z'),
    declaration(3,'q2','2026-09-25T08:00:00Z'),terminal(4,'q2','quest.completed','2026-09-25T09:00:00Z')
  ];
  const result=evaluateChallengeAdmission(events,normalized,{now:'2026-09-26T12:00:00Z'});
  assert.equal(result.allowed,false);
  assert.match(result.reasons.join(' '),/seven-day/);
});

test('profile stops after three misses in the last five Challenge outcomes',()=>{
  const events=[];
  const types=['quest.expired','quest.completed','quest.expired','quest.completed','quest.expired'];
  for(let i=0;i<5;i++){
    events.push(declaration(i*2+1,`q${i}`,`2026-09-${String(10+i).padStart(2,'0')}T08:00:00Z`));
    events.push(terminal(i*2+2,`q${i}`,types[i],`2026-09-${String(10+i).padStart(2,'0')}T09:00:00Z`));
  }
  const status=pressureProfileStatus(events,{now:'2026-09-18T12:00:00Z'});
  assert.equal(status.stop_triggered,true);
});

test('SIDE and unscored quests stay out of automatic pressure',()=>{
  assert.equal(evaluateChallengeAdmission([], {quest:{class:'SIDE',reward_xp:10}}, {now:'2026-09-26T12:00:00Z'}).allowed,false);
  assert.equal(evaluateChallengeAdmission([], {quest:{class:'MAIN',reward_xp:null}}, {now:'2026-09-26T12:00:00Z'}).allowed,false);
});
