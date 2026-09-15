import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { requestHash, resolvePgPool } from '../src/store-v2.mjs';

const databaseUrl = process.env.TEST_DATABASE_URL?.trim();
const context = {
  actor: 'chatgpt',
  source: 'postgres-reward-economy-v2-test',
  sourceRef: 'system-reward-economy:v2'
};
const scoredContext = {
  ...context,
  sourceRef: 'system-quest-difficulty:v1;test=reward-economy-v2'
};

async function rejectsWith(promise, pattern) {
  await assert.rejects(promise, pattern);
}

test('PostgreSQL reward economy v2 keeps cosmetics and gates real-world rewards without authorizing spending', { skip: !databaseUrl }, async () => {
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
    '../migrations/010_reward_economy_v2.sql'
  ].map((relative) => fileURLToPath(new URL(relative, import.meta.url)));

  const apply = async (action, key, ctx = context, hash = requestHash(action, ctx)) => {
    const { rows } = await pool.query(
      'SELECT replay, event FROM system_apply_action($1::jsonb,$2,$3,$4,$5,$6)',
      [JSON.stringify(action), ctx.actor, ctx.source, ctx.sourceRef, key, hash]
    );
    return rows[0];
  };

  const applyScored = async (action, key, ctx = scoredContext, hash = requestHash(action, ctx)) => {
    const { rows } = await pool.query(
      'SELECT replay, event FROM system_apply_scored_quest_v1($1::jsonb,$2,$3,$4,$5,$6)',
      [JSON.stringify(action), ctx.actor, ctx.source, ctx.sourceRef, key, hash]
    );
    return rows[0];
  };

  try {
    for (const migrationPath of migrationPaths) {
      await pool.query(await fs.readFile(migrationPath, 'utf8'));
    }
    await pool.query('TRUNCATE system_push_deliveries, system_push_subscriptions, system_events RESTART IDENTITY');

    await apply({
      type: 'profile.calibrate',
      payload: {
        level: 1,
        xp_to_next: 500,
        economy_status: 'CALIBRATED',
        evidence: { status: 'verified', source: 'ci', ref: 'ci:reward-economy-calibration' }
      }
    }, 'reward-v2-profile-calibrated');

    const fundingQuest = {
      type: 'quest.create',
      payload: {
        quest_id: 'reward-v2-funding-quest',
        quest_version: 2,
        title: 'Reward economy funding probe',
        class: 'SIDE',
        rank: 'S',
        reward_xp: 160,
        reward_coins: 8,
        outcome_key: 'ci/reward-economy/funding',
        objectives: []
      }
    };
    const fundingCreated = await applyScored(fundingQuest, 'reward-v2-funding-create');
    assert.equal(fundingCreated.event.payload.reward_policy_ref, 'system-quest-reward:v1');
    assert.equal(fundingCreated.event.payload.outcome_key, 'ci/reward-economy/funding');

    const completed = await apply({
      type: 'quest.complete',
      payload: {
        quest_id: 'reward-v2-funding-quest',
        evidence: { status: 'verified', source: 'ci', ref: 'ci:reward-economy-complete' }
      }
    }, 'reward-v2-funding-complete');
    const funded = await apply({
      type: 'progression.award',
      payload: {
        xp: 160,
        coins: 8,
        basis_event_id: completed.event.event_id,
        evidence: { status: 'verified', source: 'ci', ref: 'ci:reward-economy-funding' }
      }
    }, 'reward-v2-funding-award');
    assert.equal(funded.event.payload.reward_policy_ref, 'system-quest-reward:v1');
    assert.equal(funded.event.payload.coins, 8);

    const realItemAction = {
      type: 'shop.item.upsert',
      payload: {
        item_id: 'reward-v2-real-small',
        title: 'Награда на выбор: малая',
        description: 'Budget-gated reward probe',
        cost_coins: 4,
        active: true,
        repeatable: false,
        reward_type: 'REAL_WORLD_CHOICE',
        external_value: 'BUDGET_GATED',
        fulfillment_mode: 'RON',
        finance_gate_required: true,
        finance_gate_mode: 'CURRENT_DISCRETIONARY_BUDGET'
      }
    };
    const configured = await apply(realItemAction, 'reward-v2-real-item');
    assert.equal(configured.event.event_type, 'shop.item.upserted');
    assert.equal(configured.event.payload.reward_type, 'REAL_WORLD_CHOICE');
    assert.equal(configured.event.payload.external_action_authorized, false);

    await rejectsWith(
      apply({ type: 'shop.redeem', payload: { item_id: 'reward-v2-real-small' } }, 'reward-v2-missing-gate'),
      /requires finance_gate/
    );

    await rejectsWith(
      apply({
        type: 'shop.redeem',
        payload: {
          item_id: 'reward-v2-real-small',
          finance_gate: {
            status: 'APPROVED',
            mode: 'CURRENT_DISCRETIONARY_BUDGET',
            checked_at: '2000-01-01T00:00:00Z',
            currency: 'TRY',
            max_spend: 500,
            evidence_ref: 'finance:stale'
          }
        }
      }, 'reward-v2-stale-gate'),
      /finance gate is stale/
    );

    await rejectsWith(
      apply({
        type: 'shop.redeem',
        payload: {
          item_id: 'reward-v2-real-small',
          finance_gate: {
            status: 'APPROVED',
            mode: 'CURRENT_DISCRETIONARY_BUDGET',
            checked_at: new Date().toISOString(),
            currency: 'TRY',
            max_spend: 500,
            evidence_ref: 'finance:current',
            currency_per_coin: 100
          }
        }
      }, 'reward-v2-fixed-rate-gate'),
      /fixed Coin-to-money conversion fields are forbidden/
    );

    const validGate = {
      status: 'APPROVED',
      mode: 'CURRENT_DISCRETIONARY_BUDGET',
      checked_at: new Date().toISOString(),
      currency: 'TRY',
      max_spend: 500,
      evidence_ref: 'finance:current-discretionary-budget:test'
    };
    const redeemed = await apply({
      type: 'shop.redeem',
      payload: {
        item_id: 'reward-v2-real-small',
        note: 'Internal unlock only',
        finance_gate: validGate
      }
    }, 'reward-v2-real-redeem');
    assert.equal(redeemed.replay, false);
    assert.equal(redeemed.event.event_type, 'shop.redeemed');
    assert.equal(redeemed.event.payload.reward_type, 'REAL_WORLD_CHOICE');
    assert.equal(redeemed.event.payload.cost_coins, 4);
    assert.equal(redeemed.event.payload.external_action_authorized, false);
    assert.equal(redeemed.event.payload.finance_gate.status, 'APPROVED');
    assert.equal(redeemed.event.payload.finance_gate.currency, 'TRY');
    assert.equal(Number(redeemed.event.payload.finance_gate.max_spend), 500);

    const replay = await apply({
      type: 'shop.redeem',
      payload: {
        item_id: 'reward-v2-real-small',
        note: 'Internal unlock only',
        finance_gate: validGate
      }
    }, 'reward-v2-real-redeem');
    assert.equal(replay.replay, true);
    assert.equal(replay.event.event_id, redeemed.event.event_id);

    await rejectsWith(
      apply({ ...realItemAction, payload: { ...realItemAction.payload, item_id: 'reward-v2-rate-item', coin_rate: 100 } }, 'reward-v2-rate-item'),
      /fixed Coin-to-money conversion fields are forbidden/
    );

    await rejectsWith(
      apply({ ...realItemAction, payload: { ...realItemAction.payload, item_id: 'reward-v2-repeatable', repeatable: true } }, 'reward-v2-repeatable-item'),
      /must be non-repeatable/
    );

    const cosmetic = await apply({
      type: 'shop.item.upsert',
      payload: {
        item_id: 'reward-v2-cosmetic',
        title: 'Cosmetic regression probe',
        description: 'System-only cosmetic',
        cost_coins: 1,
        active: true,
        repeatable: false,
        reward_type: 'COSMETIC',
        external_value: 'NONE',
        fulfillment_mode: 'SYSTEM',
        finance_gate_required: false,
        finance_gate_mode: null
      }
    }, 'reward-v2-cosmetic-item');
    assert.equal(cosmetic.event.payload.reward_type, 'COSMETIC');

    const cosmeticRedeem = await apply({
      type: 'shop.redeem',
      payload: { item_id: 'reward-v2-cosmetic', note: 'Cosmetic preserved' }
    }, 'reward-v2-cosmetic-redeem');
    assert.equal(cosmeticRedeem.event.event_type, 'shop.redeemed');
    assert.equal(cosmeticRedeem.event.payload.reward_type, 'COSMETIC');
    assert.equal(cosmeticRedeem.event.payload.external_action_authorized, false);
    assert.equal(Object.hasOwn(cosmeticRedeem.event.payload, 'finance_gate'), false);
  } finally {
    await pool.end();
  }
});
