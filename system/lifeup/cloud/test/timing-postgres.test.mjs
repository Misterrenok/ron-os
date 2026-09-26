import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { requestHash, resolvePgPool } from '../src/store-v2.mjs';

const databaseUrl = process.env.TEST_DATABASE_URL?.trim();
const context = { actor: 'chatgpt', source: 'postgres-timing-v2-test', sourceRef: 'ci:timing-v2' };

async function rejectsWith(promise, pattern) {
  await assert.rejects(promise, pattern);
}

test('direct PostgreSQL system_apply_action cannot bypass Timing/Pressure v2 guard', { skip: !databaseUrl }, async () => {
  const Pool = resolvePgPool(await import('pg'));
  const pool = new Pool({ connectionString: databaseUrl, ssl: false, max: 1 });
  const migrationPaths = [
    '../schema.sql',
    '../migrations/002_action_gate.sql',
    '../migrations/003_profile_domain.sql',
    '../migrations/004_calibration_v1.sql',
    '../migrations/005_quest_v2.sql',
    '../migrations/006_player_focus_slot.sql',
    '../migrations/007_deadline_push_delivery.sql',
    '../migrations/016_level_progression_v2.sql'
  ].map((relative) => fileURLToPath(new URL(relative, import.meta.url)));
  const timingMigrationPath = migrationPaths.at(-2);
  const finalMigrationPaths = [
    '../migrations/008_outcome_key_v1.sql',
    '../migrations/009_open_focus_quest_model.sql',
    '../migrations/016_level_progression_v2.sql'
  ].map((relative) => fileURLToPath(new URL(relative, import.meta.url)));

  const apply = async (action, key) => {
    const { rows } = await pool.query(
      'SELECT replay, event FROM system_apply_action($1::jsonb,$2,$3,$4,$5,$6)',
      [JSON.stringify(action), context.actor, context.source, context.sourceRef, key, requestHash(action, context)]
    );
    return rows[0];
  };

  try {
    for (const migrationPath of migrationPaths) {
      await pool.query(await fs.readFile(migrationPath, 'utf8'));
    }

    await rejectsWith(
      apply({
        type: 'quest.create',
        payload: {
          quest_id: 'pg-timing-missing-mode',
          quest_version: 2,
          title: 'Missing timing mode',
          deadline_at: '2099-01-01T00:00:00Z',
          objectives: []
        }
      }, 'pg-timing-missing-mode'),
      /timing_mode is required/
    );

    await rejectsWith(
      apply({
        type: 'quest.create',
        payload: {
          quest_id: 'pg-timing-blank-mode',
          quest_version: 2,
          title: 'Blank timing mode',
          deadline_at: '2099-01-01T00:00:00Z',
          timing_mode: '   ',
          objectives: []
        }
      }, 'pg-timing-blank-mode'),
      /timing_mode is required/
    );

    await rejectsWith(
      apply({
        type: 'quest.create',
        payload: {
          quest_id: 'pg-timing-none-deadline',
          quest_version: 2,
          title: 'Artificial NONE deadline',
          deadline_at: '2099-01-01T00:00:00Z',
          timing_mode: 'NONE',
          objectives: []
        }
      }, 'pg-timing-none-deadline'),
      /HARD_EXTERNAL or CHALLENGE/
    );

    await rejectsWith(
      apply({
        type: 'quest.create',
        payload: {
          quest_id: 'pg-timing-hard-without-deadline',
          quest_version: 2,
          title: 'Hard mode without deadline',
          timing_mode: 'HARD_EXTERNAL',
          objectives: []
        }
      }, 'pg-timing-hard-without-deadline'),
      /requires payload.deadline_at/
    );

    await rejectsWith(
      apply({
        type: 'quest.create',
        payload: {
          quest_id: 'pg-timing-challenge',
          quest_version: 2,
          title: 'Challenge must stay closed',
          deadline_at: '2099-01-01T00:00:00Z',
          timing_mode: 'CHALLENGE',
          objectives: []
        }
      }, 'pg-timing-challenge'),
      /CHALLENGE timing is not activated/
    );

    await rejectsWith(
      apply({
        type: 'quest.create',
        payload: {
          quest_id: 'pg-timing-contract',
          quest_version: 2,
          title: 'Premature challenge contract',
          challenge_contract: {
            contract_id: 'contract-1',
            recovery_title: 'Recovery',
            recovery_objective: 'Return to task'
          },
          objectives: []
        }
      }, 'pg-timing-contract'),
      /challenge_contract is allowed only after CHALLENGE runtime activation/
    );

    await rejectsWith(
      apply({
        type: 'quest.create',
        payload: {
          quest_id: 'pg-timing-recommended-as-deadline',
          quest_version: 2,
          title: 'Recommended window is not a quest deadline',
          timing_mode: 'RECOMMENDED_WINDOW',
          objectives: []
        }
      }, 'pg-timing-recommended-as-deadline'),
      /requires payload.deadline_at/
    );

    await rejectsWith(
      apply({ type: 'quest.create', payload: { title: 'Legacy smuggle', timing_mode: 'CHALLENGE' } }, 'pg-timing-legacy-smuggle'),
      /timing fields require a Quest v2 create/
    );

    // Re-running 007 alone must keep its timing guard stable. Production startup then
    // reapplies newer migrations in order, so install 008/009 and restore the current level guard before asserting the final gate.
    await pool.query(await fs.readFile(timingMigrationPath, 'utf8'));
    for (const migrationPath of finalMigrationPaths) {
      await pool.query(await fs.readFile(migrationPath, 'utf8'));
    }

    const valid = await apply({
      type: 'quest.create',
      payload: {
        quest_id: 'pg-timing-hard-valid',
        quest_version: 2,
        title: 'Explicit external deadline',
        deadline_at: '2099-01-01T00:00:00Z',
        timing_mode: 'HARD_EXTERNAL',
        objectives: []
      }
    }, 'pg-timing-hard-valid');
    assert.equal(valid.replay, false);
    assert.equal(valid.event.event_type, 'quest.created');

    await apply(
      { type: 'quest.cancel', payload: { quest_id: 'pg-timing-hard-valid', reason: 'test cleanup' } },
      'pg-timing-hard-valid-cleanup'
    );
  } finally {
    await pool.end();
  }
});
