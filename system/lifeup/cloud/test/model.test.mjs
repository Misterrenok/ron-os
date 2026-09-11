import test from 'node:test';
import assert from 'node:assert/strict';
import { actionToEvent, buildSnapshot, emptyState, reduceEvent, validateEventAgainstHistory } from '../src/model.mjs';

function stamp(event) {
  event.occurred_at = new Date().toISOString();
  return event;
}

test('empty System is explicitly uncalibrated instead of inventing current progression', () => {
  const state = emptyState();
  assert.equal(state.profile.initialized, false);
  assert.equal(state.profile.level, null);
  assert.equal(state.profile.rank, null);
  assert.equal(state.profile.economy_status, 'UNCALIBRATED');
  assert.equal(state.attributes.STR, null);
  assert.equal(state.attribute_meta.STR, null);
  assert.deepEqual(state.skills, []);
});

test('quest completion can be reported without becoming verified execution', () => {
  const created = stamp(actionToEvent({ type: 'quest.create', payload: { title: 'Test quest', class: 'SIDE', rank: 'E' } }));
  const complete = stamp(actionToEvent({
    type: 'quest.complete',
    payload: { quest_id: created.payload.quest_id, evidence: { status: 'reported', source: 'ron' } }
  }));
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
  const award = stamp(actionToEvent({
    type: 'progression.award',
    payload: {
      xp: 10,
      coins: 3,
      basis_event_id: 'event-123',
      evidence: { status: 'verified', source: 'live-owner', ref: 'owner:event-123' }
    }
  }));
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
  const created = stamp(actionToEvent({ type: 'quest.create', payload: { title: 'Verified quest' } }));
  const complete = stamp(actionToEvent({ type: 'quest.complete', payload: { quest_id: created.payload.quest_id, evidence: { status: 'verified', source: 'live-owner', ref: 'owner:1' } } }));
  validateEventAgainstHistory(complete, [created]);
  const award = actionToEvent({ type: 'progression.award', payload: { xp: 4, basis_event_id: complete.event_id, evidence: { status: 'verified', source: 'live-owner', ref: 'owner:1' } } });
  assert.doesNotThrow(() => validateEventAgainstHistory(award, [created, complete]));
  stamp(award);
  const second = actionToEvent({ type: 'progression.award', payload: { coins: 1, basis_event_id: complete.event_id, evidence: { status: 'verified', source: 'live-owner', ref: 'owner:1' } } });
  assert.throws(() => validateEventAgainstHistory(second, [created, complete, award]), /already awarded/);
});

test('profile calibration is partial, verified and never fills unknown fields', () => {
  assert.throws(() => actionToEvent({
    type: 'profile.calibrate',
    payload: { level: 3, evidence: { status: 'verified', source: 'ron-os' } }
  }), /evidence.ref is required/);

  const calibration = stamp(actionToEvent({
    type: 'profile.calibrate',
    payload: { level: 3, evidence: { status: 'verified', source: 'ron-os', ref: 'system:profile-scale-v1' } }
  }));
  const state = buildSnapshot([calibration]);
  assert.equal(state.profile.initialized, true);
  assert.equal(state.profile.level, 3);
  assert.equal(state.profile.rank, null);
  assert.equal(state.profile.xp_to_next, null);
  assert.equal(state.profile.economy_status, 'UNCALIBRATED');
});

test('attributes require explicit scale provenance and keep metadata', () => {
  assert.throws(() => actionToEvent({
    type: 'attribute.set',
    payload: { name: 'STR', value: 7, evidence: { status: 'verified', source: 'ron-os', ref: 'owner:strength' } }
  }), /scale_ref is required/);

  const event = stamp(actionToEvent({
    type: 'attribute.set',
    payload: { name: 'STR', value: 7, scale_ref: 'attribute-scale:v1', evidence: { status: 'verified', source: 'ron-os', ref: 'owner:strength' } }
  }));
  const state = buildSnapshot([event]);
  assert.equal(state.attributes.STR, 7);
  assert.equal(state.attributes.INT, null);
  assert.equal(state.attribute_meta.STR.scale_ref, 'attribute-scale:v1');
  assert.equal(state.attribute_meta.STR.claim, 'VERIFIED');
});

test('skills may exist without an invented level and later receive a scaled level', () => {
  const first = stamp(actionToEvent({
    type: 'skill.upsert',
    payload: { skill_id: 'skill-learning', name: 'Learning', domain: 'learning', evidence: { status: 'verified', source: 'ron-os', ref: 'domains/learning.md' } }
  }));
  let state = buildSnapshot([first]);
  assert.equal(state.skills[0].level, null);
  assert.equal(state.skills[0].scale_ref, null);

  const second = stamp(actionToEvent({
    type: 'skill.upsert',
    payload: { skill_id: 'skill-learning', name: 'Learning', domain: 'learning', level: 2, scale_ref: 'skill-scale:v1', evidence: { status: 'verified', source: 'ron-os', ref: 'domains/learning.md' } }
  }));
  state = buildSnapshot([first, second]);
  assert.equal(state.skills.length, 1);
  assert.equal(state.skills[0].level, 2);
  assert.equal(state.skills[0].scale_ref, 'skill-scale:v1');
});

test('achievement unlock requires verified provenance and cannot be duplicated', () => {
  const unlocked = stamp(actionToEvent({
    type: 'achievement.unlock',
    payload: { achievement_id: 'ach-1', title: 'First verified milestone', rank: 'E', evidence: { status: 'verified', source: 'live-owner', ref: 'owner:milestone-1' } }
  }));
  const duplicate = actionToEvent({
    type: 'achievement.unlock',
    payload: { achievement_id: 'ach-1', title: 'Duplicate', rank: 'E', evidence: { status: 'verified', source: 'live-owner', ref: 'owner:milestone-1' } }
  });
  assert.throws(() => validateEventAgainstHistory(duplicate, [unlocked]), /already unlocked/);
});

test('shop redemption is blocked until economy is calibrated and sufficient coins exist', () => {
  const item = stamp(actionToEvent({ type: 'shop.item.upsert', payload: { item_id: 'reward-break', title: 'Reward break', cost_coins: 2 } }));
  const blocked = actionToEvent({ type: 'shop.redeem', payload: { item_id: 'reward-break', redemption_id: 'redeem-1' } });
  assert.throws(() => validateEventAgainstHistory(blocked, [item]), /economy is uncalibrated/);

  const calibration = stamp(actionToEvent({ type: 'profile.calibrate', payload: { economy_status: 'CALIBRATED', evidence: { status: 'verified', source: 'system-config', ref: 'economy:v1' } } }));
  const quest = stamp(actionToEvent({ type: 'quest.create', payload: { quest_id: 'shop-q', title: 'Earn coins' } }));
  const completion = stamp(actionToEvent({ type: 'quest.complete', payload: { quest_id: 'shop-q', evidence: { status: 'verified', source: 'live-owner', ref: 'owner:shop-q' } } }));
  const award = stamp(actionToEvent({ type: 'progression.award', payload: { coins: 3, basis_event_id: completion.event_id, evidence: { status: 'verified', source: 'live-owner', ref: 'owner:shop-q' } } }));
  const history = [item, calibration, quest, completion, award];
  const redeem = stamp(actionToEvent({ type: 'shop.redeem', payload: { item_id: 'reward-break', redemption_id: 'redeem-1' } }));
  assert.doesNotThrow(() => validateEventAgainstHistory(redeem, history));
  const state = buildSnapshot([...history, redeem]);
  assert.equal(state.profile.coins, 1);
  assert.equal(state.shop[0].redemptions, 1);

  const second = actionToEvent({ type: 'shop.redeem', payload: { item_id: 'reward-break', redemption_id: 'redeem-2' } });
  assert.throws(() => validateEventAgainstHistory(second, [...history, redeem]), /not repeatable/);
});

test('notifications have explicit unread/read transitions', () => {
  const pushed = stamp(actionToEvent({ type: 'notification.push', payload: { notification_id: 'n-1', title: 'System online', severity: 'SUCCESS' } }));
  const ack = stamp(actionToEvent({ type: 'notification.ack', payload: { notification_id: 'n-1' } }));
  validateEventAgainstHistory(ack, [pushed]);
  const state = buildSnapshot([pushed, ack]);
  assert.equal(state.notifications[0].status, 'READ');
  const duplicateAck = actionToEvent({ type: 'notification.ack', payload: { notification_id: 'n-1' } });
  assert.throws(() => validateEventAgainstHistory(duplicateAck, [pushed, ack]), /already acknowledged/);
});
