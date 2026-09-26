import test from 'node:test';
import assert from 'node:assert/strict';
import { planPlayerFeedbackActions, runPlayerFeedbackSweep } from '../src/player-feedback-engine.mjs';

const award=(seq,id,at,xp,coins=0)=>({seq,event_id:id,event_type:'progression.awarded',occurred_at:at,payload:{xp,coins}});
const achievement=(seq,id,at,title='Первый шаг')=>({seq,event_id:id,event_type:'achievement.unlocked',occurred_at:at,payload:{title,description:'Подтверждённый этап',rank:'E'}});

test('historical progression before activation is not backfilled',()=>{
  const plans=planPlayerFeedbackActions([
    award(1,'a1','2026-09-26T03:00:00Z',10)
  ],{activationAt:'2026-09-26T06:40:00Z'});
  assert.deepEqual(plans,[]);
});

test('new progression creates one SUCCESS/REWARD notification with exact XP',()=>{
  const plans=planPlayerFeedbackActions([
    award(1,'old','2026-09-26T03:00:00Z',95),
    award(2,'new','2026-09-26T06:41:00Z',10)
  ],{activationAt:'2026-09-26T06:40:00Z'});
  assert.equal(plans.length,1);
  assert.equal(plans[0].action.payload.kind,'REWARD');
  assert.equal(plans[0].action.payload.severity,'SUCCESS');
  assert.match(plans[0].action.payload.title,/Уровень повышен: 2/);
  assert.match(plans[0].action.payload.body,/\+10 XP/);
  assert.match(plans[0].action.payload.body,/Уровень 1 → 2/);
  assert.match(plans[0].action.payload.body,/До уровня 3: 105 XP/);
});

test('new achievement creates one SUCCESS/ACHIEVEMENT notification',()=>{
  const plans=planPlayerFeedbackActions([
    achievement(1,'ach-1','2026-09-26T06:41:00Z','Первый подтверждённый шаг')
  ],{activationAt:'2026-09-26T06:40:00Z'});
  assert.equal(plans.length,1);
  assert.equal(plans[0].action.payload.kind,'ACHIEVEMENT');
  assert.equal(plans[0].action.payload.severity,'SUCCESS');
  assert.match(plans[0].action.payload.title,/Первый подтверждённый шаг/);
});

test('existing deterministic notification suppresses duplicate planning',()=>{
  const first=planPlayerFeedbackActions([
    award(1,'new','2026-09-26T06:41:00Z',10)
  ],{activationAt:'2026-09-26T06:40:00Z'})[0];
  const plans=planPlayerFeedbackActions([
    award(1,'new','2026-09-26T06:41:00Z',10),
    {seq:2,event_id:'n1',event_type:'notification.pushed',occurred_at:'2026-09-26T06:41:01Z',payload:{notification_id:first.notification_id}}
  ],{activationAt:'2026-09-26T06:40:00Z'});
  assert.deepEqual(plans,[]);
});

test('sweep writes notification and immediately calls push callback',async()=>{
  const events=[award(1,'new','2026-09-26T06:41:00Z',10)];
  const writes=[]; const pushed=[];
  const store={
    async listAllEvents(){return events;},
    async applyAction(action,context,key){
      writes.push({action,context,key});
      return {replay:false,event:{event_type:'notification.pushed',event_id:'notif-event',payload:action.payload}};
    }
  };
  const out=await runPlayerFeedbackSweep({store,activationAt:'2026-09-26T06:40:00Z',onNotification:async event=>pushed.push(event)});
  assert.equal(out.length,1);
  assert.equal(writes.length,1);
  assert.equal(pushed.length,1);
  assert.equal(writes[0].action.payload.kind,'REWARD');
});
