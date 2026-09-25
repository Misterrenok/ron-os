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
  '../migrations/014_execution_reminder_v1.sql'
].map((relative) => fileURLToPath(new URL(relative, import.meta.url)));

test('PostgreSQL execution reminder schedule is active-quest-bound and idempotent', { skip: !databaseUrl }, async () => {
  const Pool = resolvePgPool(await import('pg'));
  const pool = new Pool({ connectionString: databaseUrl, ssl: false, max: 1 });
  const context = { actor: 'chatgpt', source: 'execution-reminder-postgres-test', sourceRef: 'ci:execution-reminder-v1' };
  try {
    for (const migrationPath of migrationPaths) await pool.query(await fs.readFile(migrationPath, 'utf8'));

    const questAction = {
      type: 'quest.create',
      payload: {
        quest_id: 'pg-execution-reminder-q1', quest_version: 2, title: 'Reminder quest', class: 'SIDE', rank: 'E',
        reward_xp: null, reward_coins: null, objectives: [], deadline_at: null, visibility: 'VISIBLE'
      }
    };
    await pool.query(
      'SELECT replay,event FROM system_apply_action($1::jsonb,$2,$3,$4,$5,$6)',
      [JSON.stringify(questAction), context.actor, context.source, context.sourceRef, 'pg-reminder-quest-create', requestHash(questAction, context)]
    );

    const action = {
      type: 'reminder.schedule',
      payload: {
        schedule_id: 'pg-execution-reminder-r1',
        quest_id: 'pg-execution-reminder-q1',
        remind_at: new Date(Date.now() + 60_000).toISOString(),
        title: 'Сделай следующий шаг',
        body: 'Открой задание и начни.'
      }
    };
    const key = 'pg-execution-reminder-root';
    const hash = requestHash(action, context);
    const first = await pool.query(
      'SELECT replay,event FROM system_schedule_execution_reminder_v1($1::jsonb,$2,$3,$4,$5,$6)',
      [JSON.stringify(action), context.actor, context.source, context.sourceRef, key, hash]
    );
    assert.equal(first.rows[0].replay, false);
    assert.equal(first.rows[0].event.event_type, 'reminder.scheduled');
    assert.equal(first.rows[0].event.payload.quest_id, 'pg-execution-reminder-q1');

    const replay = await pool.query(
      'SELECT replay,event FROM system_schedule_execution_reminder_v1($1::jsonb,$2,$3,$4,$5,$6)',
      [JSON.stringify(action), context.actor, context.source, context.sourceRef, key, hash]
    );
    assert.equal(replay.rows[0].replay, true);

    await assert.rejects(
      pool.query(
        'SELECT replay,event FROM system_schedule_execution_reminder_v1($1::jsonb,$2,$3,$4,$5,$6)',
        [JSON.stringify({ ...action, payload: { ...action.payload, schedule_id: 'bad-missing', quest_id: 'does-not-exist' } }),
          context.actor, context.source, context.sourceRef, 'pg-execution-reminder-missing', requestHash({ ...action, payload: { ...action.payload, schedule_id: 'bad-missing', quest_id: 'does-not-exist' } }, context)]
      ),
      /existing Quest v2/
    );
  } finally {
    await pool.end();
  }
});
