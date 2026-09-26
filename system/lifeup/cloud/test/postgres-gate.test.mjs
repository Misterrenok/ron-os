import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { requestHash, resolvePgPool } from '../src/store.mjs';

const databaseUrl = process.env.TEST_DATABASE_URL?.trim();
const context = { actor: 'chatgpt', source: 'postgres-test', sourceRef: 'ci:system-calibration-v1' };

async function rejectsWith(promise, pattern) {
  await assert.rejects(promise, pattern);
}

test('PostgreSQL action gate preserves invariants and enforces current calibration v2', { skip: !databaseUrl }, async () => {
  const Pool = resolvePgPool(await import('pg'));
  const pool = new Pool({ connectionString: databaseUrl, ssl: false, max: 2 });
  const schemaPath = fileURLToPath(new URL('../schema.sql', import.meta.url));
  const gatePath = fileURLToPath(new URL('../migrations/002_action_gate.sql', import.meta.url));
  const domainPath = fileURLToPath(new URL('../migrations/003_profile_domain.sql', import.meta.url));
  const calibrationPath = fileURLToPath(new URL('../migrations/004_calibration_v1.sql', import.meta.url));
  const levelV2Path = fileURLToPath(new URL('../migrations/016_level_progression_v2.sql', import.meta.url));

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
    await pool.query(await fs.readFile(calibrationPath, 'utf8'));
    await pool.query(await fs.readFile(levelV2Path, 'utf8'));

    const create = { type: 'quest.create', payload: { quest_id: 'pg-q1', title: 'Unscored gate quest', class: 'SIDE', rank: 'E' } };
    const first = await apply(create, 'pg-create-q1');
    assert.equal(first.replay, false);
    assert.equal(first.event.event_type, 'quest.created');
    assert.equal(first.event.payload.reward_xp, null);
    const replay = await apply(create, 'pg-create-q1');
    assert.equal(replay.replay, true);
    assert.equal(replay.event.event_id, first.event.event_id);

    await rejectsWith(
      apply({ type: 'quest.cancel', payload: { quest_id: 'pg-q1', reason: 'conflict probe' } }, 'pg-create-q1'),
      /Idempotency-Key was already used/
    );

    const reported = await apply({
      type: 'quest.complete',
      payload: { quest_id: 'pg-q1', evidence: { status: 'reported', source: 'ron', ref: 'ci-report' } }
    }, 'pg-complete-reported-q1');
    await rejectsWith(
      apply({
        type: 'progression.award',
        payload: { xp: 5, coins: 0, basis_event_id: reported.event.event_id, evidence: { status: 'verified', source: 'live-owner', ref: 'ci' } }
      }, 'pg-award-reported-q1'),
      /progression basis must be verified/
    );

    await rejectsWith(
      apply({ type: 'profile.calibrate', payload: { level: 1, xp_to_next: 100, economy_status: 'CALIBRATED', evidence: { status: 'verified', source: 'ron-os' } } }, 'pg-profile-no-ref'),
      /evidence.ref is required/
    );
    await rejectsWith(
      apply({ type: 'profile.calibrate', payload: { economy_status: 'CALIBRATED', evidence: { status: 'verified', source: 'system-config', ref: 'calibration:v2' } } }, 'pg-profile-missing-level'),
      /requires derived level and xp_to_next/
    );
    await rejectsWith(
      apply({ type: 'profile.calibrate', payload: { level: 2, xp_to_next: 500, economy_status: 'CALIBRATED', evidence: { status: 'verified', source: 'system-config', ref: 'calibration:v2' } } }, 'pg-profile-wrong-level'),
      /must match system-level-xp:v2/
    );

    const profile = await apply({
      type: 'profile.calibrate',
      payload: { level: 1, xp_to_next: 100, economy_status: 'CALIBRATED', evidence: { status: 'verified', source: 'system-config', ref: 'calibration:v2' } }
    }, 'pg-profile-launch');
    assert.equal(profile.event.payload.level, 1);
    assert.equal(profile.event.payload.xp_to_next, 100);
    assert.equal(profile.event.payload.level_policy_ref, 'system-level-xp:v2');
    assert.equal(profile.event.payload.reward_policy_ref, 'system-quest-reward:v1');

    await rejectsWith(
      apply({ type: 'profile.calibrate', payload: { rank: 'E', evidence: { status: 'verified', source: 'rank-review', ref: 'rank:too-early' } } }, 'pg-rank-too-early'),
      /rank review requires at least 20 verified rewarded completions spanning 28 days/
    );

    await rejectsWith(
      apply({
        type: 'attribute.set',
        payload: { name: 'STR', value: 3, scale_ref: 'made-up-scale', evidence: { status: 'verified', source: 'ron-os', ref: 'owner:strength' } }
      }, 'pg-attribute-wrong-scale'),
      /attribute scale_ref must be system-attribute-ordinal5:v1/
    );
    await rejectsWith(
      apply({
        type: 'attribute.set',
        payload: { name: 'STR', value: 7, scale_ref: 'system-attribute-ordinal5:v1', evidence: { status: 'verified', source: 'ron-os', ref: 'owner:strength' } }
      }, 'pg-attribute-out-of-range'),
      /attribute value must be 1..5 or null/
    );
    const attribute = await apply({
      type: 'attribute.set',
      payload: { name: 'STR', value: 3, scale_ref: 'system-attribute-ordinal5:v1', evidence: { status: 'verified', source: 'ron-os', ref: 'owner:strength' } }
    }, 'pg-attribute-str');
    assert.equal(attribute.event.payload.value, 3);

    const unrankedSkill = await apply({
      type: 'skill.upsert',
      payload: { skill_id: 'pg-skill-learning', name: 'Learning', domain: 'learning', evidence: { status: 'verified', source: 'ron-os', ref: 'domains/learning.md' } }
    }, 'pg-skill-learning');
    assert.equal(unrankedSkill.event.payload.level, null);
    await rejectsWith(
      apply({
        type: 'skill.upsert',
        payload: { skill_id: 'pg-skill-wrong', name: 'Wrong', domain: 'test', level: 2, scale_ref: 'other', evidence: { status: 'verified', source: 'ron-os', ref: 'skill:wrong' } }
      }, 'pg-skill-wrong-scale'),
      /skill scale_ref must be system-skill-competency5:v1/
    );
    const rankedSkill = await apply({
      type: 'skill.upsert',
      payload: { skill_id: 'pg-skill-ranked', name: 'Ranked skill', domain: 'test', level: 2, scale_ref: 'system-skill-competency5:v1', evidence: { status: 'verified', source: 'ron-os', ref: 'skill:ranked' } }
    }, 'pg-skill-ranked');
    assert.equal(rankedSkill.event.payload.level, 2);

    await rejectsWith(
      apply({ type: 'quest.create', payload: { quest_id: 'pg-q-bad-reward', title: 'Bad reward', class: 'SIDE', rank: 'C', reward_xp: 99, reward_coins: 99 } }, 'pg-create-bad-reward'),
      /quest reward does not match system-quest-reward:v1/
    );
    const scored = await apply({
      type: 'quest.create',
      payload: { quest_id: 'pg-q2', title: 'Calibrated C quest', class: 'SIDE', rank: 'C', reward_xp: 20, reward_coins: 1 }
    }, 'pg-create-q2');
    assert.equal(scored.event.payload.reward_policy_ref, 'system-quest-reward:v1');

    const verified = await apply({
      type: 'quest.complete',
      payload: { quest_id: 'pg-q2', evidence: { status: 'verified', source: 'live-owner', ref: 'ci:verified' } }
    }, 'pg-complete-verified-q2');
    await rejectsWith(
      apply({
        type: 'progression.award',
        payload: { xp: 10, coins: 0, basis_event_id: verified.event.event_id, evidence: { status: 'verified', source: 'live-owner', ref: 'ci:verified' } }
      }, 'pg-award-wrong-q2'),
      /progression award does not match scored quest reward/
    );
    const award = await apply({
      type: 'progression.award',
      payload: { xp: 20, coins: 1, basis_event_id: verified.event.event_id, evidence: { status: 'verified', source: 'live-owner', ref: 'ci:verified' } }
    }, 'pg-award-q2');
    assert.equal(award.event.payload.reward_policy_ref, 'system-quest-reward:v1');
    await rejectsWith(
      apply({
        type: 'progression.award',
        payload: { xp: 20, coins: 1, basis_event_id: verified.event.event_id, evidence: { status: 'verified', source: 'live-owner', ref: 'ci:verified' } }
      }, 'pg-award-double-q2'),
      /progression already awarded/
    );

    await rejectsWith(
      apply({ type: 'profile.calibrate', payload: { level: 1, xp_to_next: 100, evidence: { status: 'verified', source: 'system-config', ref: 'level:wrong-after-xp' } } }, 'pg-level-stale'),
      /must match system-level-xp:v2/
    );
    const levelSync = await apply({
      type: 'profile.calibrate',
      payload: { level: 1, xp_to_next: 80, evidence: { status: 'verified', source: 'system-config', ref: 'level:after-20xp' } }
    }, 'pg-level-sync');
    assert.equal(levelSync.event.payload.level_policy_ref, 'system-level-xp:v2');

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
        '{"name":"STR","value":99,"scale_ref":"system-attribute-ordinal5:v1","evidence":{"status":"verified","source":"fake","ref":"fake"}}'::jsonb)`),
      /attribute value must be 1..5 or null/
    );
    await rejectsWith(
      pool.query(`INSERT INTO system_events(event_id,event_type,actor,source,source_ref,claim_status,idempotency_key,request_hash,payload)
        VALUES(gen_random_uuid(),'quest.created','chatgpt','direct-sql','ci','derived','pg-direct-reward-bypass','raw-hash',
        '{"quest_id":"raw-q","title":"Raw","description":"","class":"SIDE","rank":"C","reward_xp":999,"reward_coins":999}'::jsonb)`),
      /quest reward does not match system-quest-reward:v1/
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
  } finally {
    await pool.end();
  }
});
