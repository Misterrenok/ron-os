import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { requestHash, resolvePgPool } from '../src/store.mjs';

const databaseUrl = process.env.TEST_DATABASE_URL?.trim();
const context = { actor: 'chatgpt', source: 'postgres-test', sourceRef: 'ci:system-db-action-gate' };

async function rejectsWith(promise, pattern) {
  await assert.rejects(promise, pattern);
}

test('PostgreSQL action gate preserves System invariants, domain semantics and legacy idempotency', { skip: !databaseUrl }, async () => {
  const Pool = resolvePgPool(await import('pg'));
  const pool = new Pool({ connectionString: databaseUrl, ssl: false, max: 2 });
  const schemaPath = fileURLToPath(new URL('../schema.sql', import.meta.url));
  const gatePath = fileURLToPath(new URL('../migrations/002_action_gate.sql', import.meta.url));
  const domainPath = fileURLToPath(new URL('../migrations/003_profile_domain.sql', import.meta.url));

  const apply = async (action, key, ctx = context, hash = requestHash(action, ctx)) => {
    const { rows } = await pool.query(
      'SELECT replay, event FROM system_apply_action($1::jsonb,$2,$3,$4,$5,$6)',
      [JSON.stringify(action), ctx.actor, ctx.source, ctx.sourceRef, key, hash]
    );
    return rows[0];
  };

  try {
    await pool.query(await fs.readFile(schemaPath, 'utf8'));
    await pool.query(await fs.readFile(gatePath, 'utf8'));
    await pool.query(await fs.readFile(domainPath, 'utf8'));

    const create = { type: 'quest.create', payload: { quest_id: 'pg-q1', title: 'Postgres gate quest', class: 'SIDE', rank: 'E' } };
    const first = await apply(create, 'pg-create-q1');
    assert.equal(first.replay, false);
    assert.equal(first.event.event_type, 'quest.created');
    const replay = await apply(create, 'pg-create-q1');
    assert.equal(replay.replay, true);
    assert.equal(replay.event.event_id, first.event.event_id);

    const different = { type: 'quest.cancel', payload: { quest_id: 'pg-q1', reason: 'conflict probe' } };
    await rejectsWith(apply(different, 'pg-create-q1'), /Idempotency-Key was already used/);

    const reported = { type: 'quest.complete', payload: { quest_id: 'pg-q1', evidence: { status: 'reported', source: 'ron', ref: 'ci-report' } } };
    const reportedResult = await apply(reported, 'pg-complete-reported-q1');
    assert.equal(reportedResult.event.claim_status, 'reported');
    const invalidAward = {
      type: 'progression.award',
      payload: { xp: 5, coins: 1, basis_event_id: reportedResult.event.event_id, evidence: { status: 'verified', source: 'live-owner', ref: 'ci' } }
    };
    await rejectsWith(apply(invalidAward, 'pg-award-reported-q1'), /progression basis must be verified/);

    const create2 = { type: 'quest.create', payload: { quest_id: 'pg-q2', title: 'Verified Postgres gate quest', class: 'SIDE', rank: 'E' } };
    await apply(create2, 'pg-create-q2');
    const verified = { type: 'quest.complete', payload: { quest_id: 'pg-q2', evidence: { status: 'verified', source: 'live-owner', ref: 'ci:verified' } } };
    const verifiedResult = await apply(verified, 'pg-complete-verified-q2');
    const award = {
      type: 'progression.award',
      payload: { xp: 10, coins: 2, basis_event_id: verifiedResult.event.event_id, evidence: { status: 'verified', source: 'live-owner', ref: 'ci:verified' } }
    };
    const awardResult = await apply(award, 'pg-award-verified-q2');
    assert.equal(awardResult.event.event_type, 'progression.awarded');
    const secondAward = {
      type: 'progression.award',
      payload: { xp: 1, coins: 0, basis_event_id: verifiedResult.event.event_id, evidence: { status: 'verified', source: 'live-owner', ref: 'ci:verified' } }
    };
    await rejectsWith(apply(secondAward, 'pg-award-double-q2'), /progression already awarded/);
    await rejectsWith(
      apply({ type: 'quest.cancel', payload: { quest_id: 'pg-q2', reason: 'already complete' } }, 'pg-terminal-double-q2'),
      /quest is not active/
    );

    await rejectsWith(
      pool.query(`INSERT INTO system_events(event_id,event_type,actor,source,source_ref,claim_status,idempotency_key,request_hash,payload)
        VALUES(gen_random_uuid(),'progression.awarded','chatgpt','direct-sql','ci','verified','pg-direct-bypass','raw-hash',
        '{"xp":999,"coins":999,"basis_event_id":"missing","evidence":{"status":"verified","source":"fake"}}'::jsonb)`),
      /basis_event_id does not exist/
    );
    await rejectsWith(
      pool.query('UPDATE system_events SET actor=$1 WHERE event_id=$2', ['tampered', first.event.event_id]),
      /system_events is append-only/
    );

    const legacyAction = { type: 'quest.create', payload: { quest_id: 'pg-legacy-q', title: 'Legacy hash quest', class: 'SIDE', rank: 'E' } };
    const legacyContext = { actor: 'chatgpt', source: 'system-api', sourceRef: null };
    const legacyHash = requestHash(legacyAction, legacyContext);
    const legacyPayload = { quest_id: 'pg-legacy-q', title: 'Legacy hash quest', description: '', class: 'SIDE', rank: 'E', reward_xp: null, reward_coins: null };
    const legacyEventId = '11111111-1111-4111-8111-111111111111';
    await pool.query(
      `INSERT INTO system_events(event_id,event_type,actor,source,source_ref,claim_status,idempotency_key,request_hash,payload)
       VALUES($1,'quest.created',$2,$3,$4,'derived',$5,$6,$7::jsonb)`,
      [legacyEventId, legacyContext.actor, legacyContext.source, legacyContext.sourceRef, 'pg-legacy-replay', legacyHash, JSON.stringify(legacyPayload)]
    );
    const legacyReplay = await apply(legacyAction, 'pg-legacy-replay', legacyContext, legacyHash);
    assert.equal(legacyReplay.replay, true);
    assert.equal(legacyReplay.event.event_id, legacyEventId);

    await rejectsWith(
      apply({ type: 'profile.calibrate', payload: { level: 2, evidence: { status: 'verified', source: 'ron-os' } } }, 'pg-profile-no-ref'),
      /evidence.ref is required/
    );
    const profile = await apply({
      type: 'profile.calibrate',
      payload: { level: 2, evidence: { status: 'verified', source: 'ron-os', ref: 'system:profile-v1' } }
    }, 'pg-profile-level');
    assert.equal(profile.event.event_type, 'profile.calibrated');
    assert.equal(profile.event.payload.level, 2);
    assert.equal(Object.hasOwn(profile.event.payload, 'rank'), false);

    const attribute = await apply({
      type: 'attribute.set',
      payload: { name: 'STR', value: 7, scale_ref: 'attribute-scale:v1', evidence: { status: 'verified', source: 'ron-os', ref: 'owner:strength' } }
    }, 'pg-attribute-str');
    assert.equal(attribute.event.event_type, 'attribute.set');
    assert.equal(attribute.event.payload.value, 7);

    const skill = await apply({
      type: 'skill.upsert',
      payload: { skill_id: 'pg-skill-learning', name: 'Learning', domain: 'learning', evidence: { status: 'verified', source: 'ron-os', ref: 'domains/learning.md' } }
    }, 'pg-skill-learning');
    assert.equal(skill.event.payload.level, null);

    const achievement = await apply({
      type: 'achievement.unlock',
      payload: { achievement_id: 'pg-ach-1', title: 'Verified milestone', rank: 'E', evidence: { status: 'verified', source: 'live-owner', ref: 'owner:milestone' } }
    }, 'pg-achievement-1');
    assert.equal(achievement.event.event_type, 'achievement.unlocked');
    await rejectsWith(
      apply({ type: 'achievement.unlock', payload: { achievement_id: 'pg-ach-1', title: 'Duplicate', rank: 'E', evidence: { status: 'verified', source: 'live-owner', ref: 'owner:milestone' } } }, 'pg-achievement-duplicate'),
      /achievement already unlocked/
    );

    await apply({ type: 'shop.item.upsert', payload: { item_id: 'pg-shop-1', title: 'Reward break', cost_coins: 1, repeatable: false } }, 'pg-shop-item-1');
    await rejectsWith(
      apply({ type: 'shop.redeem', payload: { item_id: 'pg-shop-1', redemption_id: 'pg-redemption-1' } }, 'pg-shop-redeem-before-calibration'),
      /economy is uncalibrated/
    );
    await apply({
      type: 'profile.calibrate',
      payload: { economy_status: 'CALIBRATED', evidence: { status: 'verified', source: 'system-config', ref: 'economy:v1' } }
    }, 'pg-profile-economy');
    const redemption = await apply({ type: 'shop.redeem', payload: { item_id: 'pg-shop-1', redemption_id: 'pg-redemption-1' } }, 'pg-shop-redeem-1');
    assert.equal(redemption.event.payload.cost_coins, 1);
    await rejectsWith(
      apply({ type: 'shop.redeem', payload: { item_id: 'pg-shop-1', redemption_id: 'pg-redemption-2' } }, 'pg-shop-redeem-2'),
      /shop item is not repeatable/
    );

    const notification = await apply({ type: 'notification.push', payload: { notification_id: 'pg-n-1', title: 'System online', severity: 'SUCCESS' } }, 'pg-notification-1');
    assert.equal(notification.event.event_type, 'notification.pushed');
    const acknowledged = await apply({ type: 'notification.ack', payload: { notification_id: 'pg-n-1' } }, 'pg-notification-ack-1');
    assert.equal(acknowledged.event.event_type, 'notification.acknowledged');
    await rejectsWith(
      apply({ type: 'notification.ack', payload: { notification_id: 'pg-n-1' } }, 'pg-notification-ack-2'),
      /notification is already acknowledged/
    );

    await rejectsWith(
      pool.query(`INSERT INTO system_events(event_id,event_type,actor,source,source_ref,claim_status,idempotency_key,request_hash,payload)
        VALUES(gen_random_uuid(),'attribute.set','chatgpt','direct-sql','ci','verified','pg-direct-attribute-bypass','raw-hash',
        '{"name":"STR","value":99,"scale_ref":"","evidence":{"status":"verified","source":"fake","ref":"fake"}}'::jsonb)`),
      /scale_ref is required/
    );
  } finally {
    await pool.end();
  }
});