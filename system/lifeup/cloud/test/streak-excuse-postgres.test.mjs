import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { requestHash, resolvePgPool } from '../src/store-v2.mjs';

const databaseUrl = process.env.TEST_DATABASE_URL?.trim();
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
  '../migrations/013_challenge_timing_bridge_v1.sql',
  '../migrations/014_execution_reminder_v1.sql',
  '../migrations/015_streak_excuse_v1.sql'
].map((relative) => fileURLToPath(new URL(relative, import.meta.url)));

test('PostgreSQL streak excuse is bounded and idempotent', { skip: !databaseUrl }, async () => {
  const Pool = resolvePgPool(await import('pg'));
  const pool = new Pool({ connectionString: databaseUrl, ssl: false, max: 1 });
  const context = { actor: 'chatgpt', source: 'streak-excuse-postgres-test', sourceRef: 'system-execution-streak:v1' };
  try {
    for (const migrationPath of migrationPaths) await pool.query(await fs.readFile(migrationPath, 'utf8'));

    const action = {
      type: 'streak.excuse',
      payload: {
        local_date: new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' }).format(new Date()),
        reason_code: 'SYSTEM_FAILURE',
        reason: 'CI protected interruption'
      }
    };
    const key = 'pg-streak-excuse-root';
    const hash = requestHash(action, context);
    const first = await pool.query(
      'SELECT replay,event FROM system_excuse_execution_streak_v1($1::jsonb,$2,$3,$4,$5,$6)',
      [JSON.stringify(action), context.actor, context.source, context.sourceRef, key, hash]
    );
    assert.equal(first.rows[0].replay, false);
    assert.equal(first.rows[0].event.event_type, 'streak.excused');
    assert.match(first.rows[0].event.payload.local_date, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(first.rows[0].event.payload.reason_code, 'SYSTEM_FAILURE');

    const replay = await pool.query(
      'SELECT replay,event FROM system_excuse_execution_streak_v1($1::jsonb,$2,$3,$4,$5,$6)',
      [JSON.stringify(action), context.actor, context.source, context.sourceRef, key, hash]
    );
    assert.equal(replay.rows[0].replay, true);

    const tomorrow = new Date(Date.now() + 36 * 60 * 60 * 1000);
    const futureDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' }).format(tomorrow);
    const future = {
      type: 'streak.excuse',
      payload: { local_date: futureDate, reason_code: 'SYSTEM_FAILURE', reason: 'future pre-excuse must fail' }
    };
    await assert.rejects(
      pool.query(
        'SELECT replay,event FROM system_excuse_execution_streak_v1($1::jsonb,$2,$3,$4,$5,$6)',
        [JSON.stringify(future), context.actor, context.source, context.sourceRef, 'pg-streak-excuse-future', requestHash(future, context)]
      ),
      /cannot target a future local date/
    );

    const invalid = {
      type: 'streak.excuse',
      payload: { local_date: action.payload.local_date, reason_code: 'DID_NOT_FEEL_LIKE_IT', reason: 'invalid reason' }
    };
    await assert.rejects(
      pool.query(
        'SELECT replay,event FROM system_excuse_execution_streak_v1($1::jsonb,$2,$3,$4,$5,$6)',
        [JSON.stringify(invalid), context.actor, context.source, context.sourceRef, 'pg-streak-excuse-invalid', requestHash(invalid, context)]
      ),
      /reason_code is invalid/
    );
  } finally {
    await pool.end();
  }
});
