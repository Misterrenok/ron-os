import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { requestHash, resolvePgPool } from '../src/store-v2.mjs';

const databaseUrl = process.env.TEST_DATABASE_URL?.trim();
const context = { actor: 'chatgpt', source: 'postgres-quest-v2-test', sourceRef: 'ci:quest-v2' };

async function rejectsWith(promise, pattern) {
  await assert.rejects(promise, pattern);
}

test('PostgreSQL Quest v2 wrapper supports multiple open quests with one explicit focus while preserving lifecycle and Quest v1', { skip: !databaseUrl }, async () => {
  const Pool = resolvePgPool(await import('pg'));
  const pool = new Pool({ connectionString: databaseUrl, ssl: false, max: 2 });
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
    '../migrations/016_level_progression_v2.sql'
  ].map((relative) => fileURLToPath(new URL(relative, import.meta.url)));

  const apply = async (action, key, ctx = context, hash = requestHash(action, ctx)) => {
    const { rows } = await pool.query(
      'SELECT replay, event FROM system_apply_action($1::jsonb,$2,$3,$4,$5,$6)',
      [JSON.stringify(action), ctx.actor, ctx.source, ctx.sourceRef, key, hash]
    );
    return rows[0];
  };

  try {
    for (const migrationPath of migrationPaths) {
      await pool.query(await fs.readFile(migrationPath, 'utf8'));
    }

    await apply({
      type: 'quest.create',
      payload: { quest_id: 'pg-legacy-probe', title: 'Legacy technical probe', class: 'SIDE', rank: 'E' }
    }, 'pg-legacy-probe-create');

    const create = {
      type: 'quest.create',
      payload: {
        quest_id: 'pg-v2-q1',
        quest_version: 2,
        title: 'Structured PostgreSQL quest',
        class: 'MAIN',
        rank: 'E',
        visibility: 'HIDDEN',
        timing_mode: 'HARD_EXTERNAL',
        deadline_at: '2099-01-01T00:00:00Z',
        objectives: [
          { objective_id: 'sessions', title: 'Sessions', target: 2, unit: 'sessions', required: true }
        ]
      }
    };

    const created = await apply(create, 'pg-v2-create-q1');
    assert.equal(created.replay, false);
    assert.equal(created.event.event_type, 'quest.created');
    assert.equal(created.event.payload.quest_version, 2);
    assert.equal(created.event.payload.visibility, 'HIDDEN');
    assert.equal(created.event.payload.objectives[0].target, 2);

    const replay = await apply(create, 'pg-v2-create-q1');
    assert.equal(replay.replay, true);
    assert.equal(replay.event.event_id, created.event.event_id);

    const second = await apply({
      type: 'quest.create',
      payload: { quest_id: 'pg-v2-q2', quest_version: 2, title: 'Second open player quest', objectives: [] }
    }, 'pg-v2-create-q2');
    assert.equal(second.event.event_type, 'quest.created');
    assert.equal(second.event.payload.quest_id, 'pg-v2-q2');

    const focused = await apply({
      type: 'quest.focus',
      payload: { quest_id: 'pg-v2-q2', reason: 'higher-value current execution target' }
    }, 'pg-v2-focus-q2');
    assert.equal(focused.event.event_type, 'quest.focused');
    assert.equal(focused.event.payload.quest_id, 'pg-v2-q2');
    assert.equal(focused.event.claim_status, 'derived');

    const focusReplay = await apply({
      type: 'quest.focus',
      payload: { quest_id: 'pg-v2-q2', reason: 'higher-value current execution target' }
    }, 'pg-v2-focus-q2');
    assert.equal(focusReplay.replay, true);
    assert.equal(focusReplay.event.event_id, focused.event.event_id);

    await rejectsWith(
      apply({ type: 'quest.focus', payload: { quest_id: 'pg-v2-q2', reason: 'duplicate focus' } }, 'pg-v2-focus-q2-again'),
      /quest is already focused/
    );
    await rejectsWith(
      apply({ type: 'quest.focus', payload: { quest_id: 'pg-legacy-probe', reason: 'invalid legacy target' } }, 'pg-v1-focus-invalid'),
      /Quest v2/
    );

    await rejectsWith(
      apply({
        type: 'quest.complete',
        payload: { quest_id: 'pg-v2-q1', evidence: { status: 'verified', source: 'ci', ref: 'premature' } }
      }, 'pg-v2-complete-premature'),
      /required objectives are incomplete/
    );

    const progress1 = await apply({
      type: 'quest.progress',
      payload: {
        quest_id: 'pg-v2-q1',
        objective_id: 'sessions',
        value: 1,
        evidence: { status: 'reported', source: 'ron', ref: 'session-1' }
      }
    }, 'pg-v2-progress-1');
    assert.equal(progress1.event.event_type, 'quest.progressed');
    assert.equal(progress1.event.claim_status, 'reported');

    await rejectsWith(
      apply({
        type: 'quest.progress',
        payload: {
          quest_id: 'pg-v2-q1',
          objective_id: 'sessions',
          value: 1,
          evidence: { status: 'reported', source: 'ron', ref: 'duplicate-value' }
        }
      }, 'pg-v2-progress-same'),
      /progress must strictly increase/
    );

    await rejectsWith(
      apply({
        type: 'quest.progress',
        payload: {
          quest_id: 'pg-v2-q1',
          objective_id: 'sessions',
          value: 3,
          evidence: { status: 'reported', source: 'ron', ref: 'overshoot' }
        }
      }, 'pg-v2-progress-over'),
      /progress cannot exceed objective target/
    );

    await apply({
      type: 'quest.progress',
      payload: {
        quest_id: 'pg-v2-q1',
        objective_id: 'sessions',
        value: 2,
        evidence: { status: 'verified', source: 'ci', ref: 'sessions-complete' }
      }
    }, 'pg-v2-progress-2');

    const completed = await apply({
      type: 'quest.complete',
      payload: { quest_id: 'pg-v2-q1', evidence: { status: 'verified', source: 'ci', ref: 'objective-complete' } }
    }, 'pg-v2-complete-q1');
    assert.equal(completed.event.event_type, 'quest.completed');

    await rejectsWith(
      apply({ type: 'quest.fail', payload: { quest_id: 'pg-v2-q1', reason: 'invalid after completion' } }, 'pg-v2-fail-after-complete'),
      /quest is not active/
    );

    const reveal = await apply(
      { type: 'quest.reveal', payload: { quest_id: 'pg-v2-q1', reason: 'post-completion reveal is allowed' } },
      'pg-v2-reveal-q1'
    );
    assert.equal(reveal.event.event_type, 'quest.revealed');

    await rejectsWith(
      apply({ type: 'quest.reveal', payload: { quest_id: 'pg-v2-q1', reason: 'duplicate' } }, 'pg-v2-reveal-q1-duplicate'),
      /quest is already revealed/
    );

    await apply({ type: 'quest.fail', payload: { quest_id: 'pg-v2-q2', reason: 'explicit failure' } }, 'pg-v2-q2-fail');
    await rejectsWith(
      apply({ type: 'quest.focus', payload: { quest_id: 'pg-v2-q2', reason: 'terminal target' } }, 'pg-v2-focus-terminal-q2'),
      /quest is not active/
    );

    await apply({
      type: 'quest.create',
      payload: { quest_id: 'pg-v2-fail', quest_version: 2, title: 'Failure path', objectives: [] }
    }, 'pg-v2-create-fail');
    await apply({ type: 'quest.fail', payload: { quest_id: 'pg-v2-fail', reason: 'explicit failure' } }, 'pg-v2-fail');
    await rejectsWith(
      apply({
        type: 'quest.complete',
        payload: { quest_id: 'pg-v2-fail', evidence: { status: 'verified', source: 'ci', ref: 'invalid' } }
      }, 'pg-v2-complete-after-fail'),
      /quest is not active/
    );

    await apply({
      type: 'quest.create',
      payload: {
        quest_id: 'pg-v2-expire',
        quest_version: 2,
        title: 'Expiry path',
        timing_mode: 'HARD_EXTERNAL',
        deadline_at: '2000-01-01T00:00:00Z',
        objectives: []
      }
    }, 'pg-v2-create-expire');
    const expired = await apply(
      { type: 'quest.expire', payload: { quest_id: 'pg-v2-expire', reason: 'deadline passed' } },
      'pg-v2-expire'
    );
    assert.equal(expired.event.event_type, 'quest.expired');

    await apply({
      type: 'quest.create',
      payload: { quest_id: 'pg-v1-after-v2', title: 'Legacy still works', class: 'SIDE', rank: 'E' }
    }, 'pg-v1-after-v2-create');
    const legacyCompleted = await apply({
      type: 'quest.complete',
      payload: { quest_id: 'pg-v1-after-v2', evidence: { status: 'reported', source: 'ron', ref: 'legacy' } }
    }, 'pg-v1-after-v2-complete');
    assert.equal(legacyCompleted.event.event_type, 'quest.completed');

    await rejectsWith(
      apply({ type: 'quest.fail', payload: { quest_id: 'pg-v2-expire', reason: 'conflicting reuse' } }, 'pg-v2-expire'),
      /Idempotency-Key was already used/
    );
  } finally {
    await pool.end();
  }
});
