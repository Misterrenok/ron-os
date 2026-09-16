import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { requestHash, resolvePgPool } from '../src/store-v2.mjs';

const databaseUrl = process.env.TEST_DATABASE_URL?.trim();
const context = { actor: 'chatgpt', source: 'challenge-postgres-test', sourceRef: 'ci:challenge-v1' };

const migrationPaths = [
  '../schema.sql',
  '../migrations/002_action_gate.sql',
  '../migrations/003_profile_domain.sql',
  '../migrations/004_calibration_v1.sql',
  '../migrations/005_quest_v2.sql',
  '../migrations/006_player_focus_slot.sql',
  '../migrations/007_deadline_push_delivery.sql',
  '../migrations/008_outcome_key_v1.sql',
  '../migrations/009_open_focus_quest_model.sql',
  '../migrations/010_reward_economy_v2.sql',
  '../migrations/011_evidence_followthrough_v1.sql',
  '../migrations/012_challenge_contract_v1.sql',
  '../migrations/013_challenge_timing_bridge_v1.sql'
].map((relative) => fileURLToPath(new URL(relative, import.meta.url)));

function challengeAction({ questId, contractId, deadline }) {
  return {
    type: 'challenge.create',
    payload: {
      quest: {
        quest_id: questId,
        quest_version: 2,
        title: 'PostgreSQL Challenge',
        class: 'SIDE',
        rank: 'D',
        reward_xp: null,
        reward_coins: null,
        objectives: [{ objective_id: `${questId}-objective`, title: 'Сделать шаг', target: 1, unit: 'check', required: true }],
        deadline_at: deadline,
        visibility: 'VISIBLE'
      },
      contract: {
        contract_id: contractId,
        recovery_title: 'Вернуться коротким восстановлением',
        recovery_objective: 'Сделать восстановительный шаг',
        recovery_target: 1,
        recovery_unit: 'check'
      }
    }
  };
}

async function count(pool, eventType, field, value) {
  const { rows } = await pool.query(
    `SELECT count(*)::int AS count FROM system_events WHERE event_type=$1 AND payload->>$2=$3`,
    [eventType, field, value]
  );
  return rows[0].count;
}

test('PostgreSQL Challenge create and miss recovery are atomic, idempotent and focus-neutral', { skip: !databaseUrl }, async () => {
  const Pool = resolvePgPool(await import('pg'));
  const pool = new Pool({ connectionString: databaseUrl, ssl: false, max: 1 });
  const questId = 'pg-challenge-v1-primary';
  const contractId = '33333333-3333-4333-8333-333333333333';
  const rollbackContractId = '44444444-4444-4444-8444-444444444444';
  const deadline = new Date(Date.now() + 2200).toISOString();
  const action = challengeAction({ questId, contractId, deadline });
  const rootKey = 'pg-challenge-v1-create-root';
  const hash = requestHash(action, context);

  try {
    for (const migrationPath of migrationPaths) {
      await pool.query(await fs.readFile(migrationPath, 'utf8'));
    }

    const first = await pool.query(
      'SELECT replay, events FROM system_apply_challenge_v1($1::jsonb,$2,$3,$4,$5,$6)',
      [JSON.stringify(action), context.actor, context.source, context.sourceRef, rootKey, hash]
    );
    assert.equal(first.rows[0].replay, false);
    assert.deepEqual(first.rows[0].events.map((event) => event.event_type), ['challenge.declared', 'quest.created']);
    const created = first.rows[0].events[1];
    assert.equal(created.payload.quest_id, questId);
    assert.equal(created.payload.timing_mode, undefined);
    assert.equal(await count(pool, 'challenge.declared', 'contract_id', contractId), 1);
    assert.equal(await count(pool, 'quest.created', 'quest_id', questId), 1);

    const replay = await pool.query(
      'SELECT replay, events FROM system_apply_challenge_v1($1::jsonb,$2,$3,$4,$5,$6)',
      [JSON.stringify(action), context.actor, context.source, context.sourceRef, rootKey, hash]
    );
    assert.equal(replay.rows[0].replay, true);
    assert.equal(await count(pool, 'challenge.declared', 'contract_id', contractId), 1);
    assert.equal(await count(pool, 'quest.created', 'quest_id', questId), 1);

    const rollbackAction = challengeAction({
      questId,
      contractId: rollbackContractId,
      deadline: new Date(Date.now() + 10_000).toISOString()
    });
    await assert.rejects(
      pool.query(
        'SELECT replay, events FROM system_apply_challenge_v1($1::jsonb,$2,$3,$4,$5,$6)',
        [JSON.stringify(rollbackAction), context.actor, context.source, context.sourceRef, 'pg-challenge-v1-rollback-root', requestHash(rollbackAction, context)]
      ),
      /Challenge v1 cannot retrofit an already-created quest|quest_id already exists|scored outcome is already active or completed/
    );
    assert.equal(await count(pool, 'challenge.declared', 'contract_id', rollbackContractId), 0);

    const waitMs = Math.max(0, new Date(deadline).getTime() - Date.now() + 150);
    await new Promise((resolve) => setTimeout(resolve, waitMs));

    const expiryAction = { type: 'challenge.expire', payload: { quest_id: questId, contract_id: contractId } };
    const expiryContext = { actor: 'system', source: 'system-deadline-engine', sourceRef: 'policy:system-challenge-contract:v1' };
    const expiryKey = 'pg-challenge-v1-expire-root';
    const expiryHash = requestHash(expiryAction, expiryContext);
    const expired = await pool.query(
      'SELECT replay, events FROM system_expire_challenge_v1($1,$2,$3,$4,$5,$6,$7)',
      [questId, contractId, expiryContext.actor, expiryContext.source, expiryContext.sourceRef, expiryKey, expiryHash]
    );
    assert.equal(expired.rows[0].replay, false);
    assert.deepEqual(expired.rows[0].events.map((event) => event.event_type), ['quest.expired', 'quest.created']);
    const recovery = expired.rows[0].events[1];
    assert.equal(recovery.payload.quest_id, `challenge-recovery:${contractId}`);
    assert.equal(recovery.payload.class, 'RECOVERY');
    assert.equal(recovery.payload.reward_xp, null);
    assert.equal(recovery.payload.reward_coins, null);
    assert.equal(recovery.payload.deadline_at, null);
    assert.equal(await count(pool, 'quest.expired', 'quest_id', questId), 1);
    assert.equal(await count(pool, 'quest.created', 'quest_id', `challenge-recovery:${contractId}`), 1);

    const focusRows = await pool.query(
      `SELECT count(*)::int AS count FROM system_events WHERE event_type='quest.focused' AND payload->>'quest_id'=$1`,
      [`challenge-recovery:${contractId}`]
    );
    assert.equal(focusRows.rows[0].count, 0);

    const expiryReplay = await pool.query(
      'SELECT replay, events FROM system_expire_challenge_v1($1,$2,$3,$4,$5,$6,$7)',
      [questId, contractId, expiryContext.actor, expiryContext.source, expiryContext.sourceRef, expiryKey, expiryHash]
    );
    assert.equal(expiryReplay.rows[0].replay, true);
    assert.equal(await count(pool, 'quest.expired', 'quest_id', questId), 1);
    assert.equal(await count(pool, 'quest.created', 'quest_id', `challenge-recovery:${contractId}`), 1);
  } finally {
    await pool.end();
  }
});
