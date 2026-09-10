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

test('PostgreSQL action gate preserves System invariants and legacy idempotency', { skip: !databaseUrl }, async () => {
  const Pool = resolvePgPool(await import('pg'));
  const pool = new Pool({ connectionString: databaseUrl, ssl: false, max: 2 });
  const schemaPath = fileURLToPath(new URL('../schema.sql', import.meta.url));
  const gatePath = fileURLToPath(new URL('../migrations/002_action_gate.sql', import.meta.url));

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
  } finally {
    await pool.end();
  }
});
