import { createServer } from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CALIBRATION_REFS } from './calibration.mjs';
import { buildPlayerSnapshot } from './snapshot-projection.mjs';
import { createStore } from './execution-reminder-store.mjs';
import { DEADLINE_POLICY_VERSION, normalizeDeadlineInterval, startDeadlineEngine } from './deadline-engine.mjs';
import { createPushDelivery } from './push-delivery.mjs';
import { SHOP_POLICY_REF, SHOP_PRICE_COINS, SHOP_REWARD_TYPES } from './shop-policy.mjs';
import { EVIDENCE_FOLLOWTHROUGH_POLICY_REF, evaluateEvidenceFollowthrough } from './followthrough-policy.mjs';
import { CHALLENGE_POLICY_REF } from './challenge-contract.mjs';
import { EXECUTION_REMINDER_POLICY_REF, startExecutionReminderEngine } from './execution-reminder.mjs';

const port = Number(process.env.PORT || 8080);
const publicDir = fileURLToPath(new URL('../public/', import.meta.url));
const store = await createStore();
await store.init();
const challengeWritable = store.challengeWritesAtomic === true;
const executionReminderWritable = store.executionReminderWritesAtomic === true;
const pushDelivery = await createPushDelivery({ store }).catch((error) => {
  console.error('web push disabled:', error);
  return { enabled: false, publicKey: null, async enqueueAndDrain() {}, async drain() {} };
});
const deadlineIntervalMs = normalizeDeadlineInterval(process.env.DEADLINE_SWEEP_INTERVAL_MS);
const deadlineEngine = startDeadlineEngine({
  store,
  intervalMs: deadlineIntervalMs,
  onNotification: () => pushDelivery.enqueueAndDrain()
});
const executionReminderEngine = startExecutionReminderEngine({
  store,
  intervalMs: deadlineIntervalMs,
  onNotification: () => pushDelivery.enqueueAndDrain()
});
const pushTimer = setInterval(() => void pushDelivery.drain().catch(console.error), 30_000);
pushTimer.unref?.();
void pushDelivery.drain().catch(console.error);

const securityHeaders = {
  'content-security-policy': "default-src 'self'; connect-src 'self'; img-src 'self' data:; manifest-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; worker-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
  'permissions-policy': 'camera=(), microphone=(), geolocation=()',
  'referrer-policy': 'no-referrer',
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY'
};

function json(res, status, body, headers = {}) {
  res.writeHead(status, {
    ...securityHeaders,
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    ...headers
  });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 256_000) throw new Error('request body too large');
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function mime(filePath) {
  const ext = path.extname(filePath);
  return ({
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.webmanifest': 'application/manifest+json',
    '.svg': 'image/svg+xml'
  })[ext] || 'application/octet-stream';
}

async function serveStatic(urlPath, res) {
  const safePath = urlPath === '/' ? '/index-v2.html' : urlPath;
  const normalized = path.normalize(safePath).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(publicDir, normalized);
  if (!filePath.startsWith(publicDir)) return false;
  try {
    const body = await fs.readFile(filePath);
    res.writeHead(200, {
      ...securityHeaders,
      'content-type': mime(filePath),
      'cache-control': safePath === '/index-v2.html' ? 'no-cache' : 'public, max-age=300'
    });
    res.end(body);
    return true;
  } catch {
    return false;
  }
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    if (req.method === 'GET' && url.pathname === '/healthz') {
      return json(res, 200, {
        ok: true,
        service: 'ron-system-core',
        persistence: process.env.DATABASE_URL ? 'postgres' : 'ephemeral-dev',
        action_gate: process.env.DATABASE_URL ? 'postgres-function' : 'memory-js',
        model_version: 'quest-v2',
        deadline_engine: DEADLINE_POLICY_VERSION,
        challenge_contract: CHALLENGE_POLICY_REF,
        challenge_writes: challengeWritable ? 'postgres-atomic-v1' : 'disabled-without-postgres',
        evidence_followthrough: EVIDENCE_FOLLOWTHROUGH_POLICY_REF,
        execution_reminder_engine: EXECUTION_REMINDER_POLICY_REF,
        execution_reminder_writes: executionReminderWritable ? 'postgres-ledger-v1' : 'disabled-without-postgres',
        web_push: pushDelivery.enabled ? 'enabled' : 'disabled',
        interface_locale: 'ru-RU',
        access_mode: 'public-url',
        authentication_required: false,
        device_session: 'not-required',
        shop_policy: SHOP_POLICY_REF,
        phone_dependency: false
      });
    }

    if (url.pathname.startsWith('/api/')) {
      if (req.method === 'GET' && url.pathname === '/api/v1/capabilities') {
        return json(res, 200, {
          version: 'v1',
          model_version: 'quest-v2',
          backward_compatible_with: ['calibration-v1', 'quest-v1'],
          access: {
            mode: 'public-url',
            authentication_required: false,
            bearer_token: false,
            password: false,
            device_session: false
          },
          calibration: {
            level_policy_ref: CALIBRATION_REFS.level,
            reward_policy_ref: CALIBRATION_REFS.reward,
            attribute_scale_ref: CALIBRATION_REFS.attribute,
            skill_scale_ref: CALIBRATION_REFS.skill,
            rank_policy_ref: CALIBRATION_REFS.rank,
            unknown_is_null: true,
            retroactive_xp: false
          },
          quest_v2: {
            structured_objectives: true,
            absolute_monotonic_progress: true,
            same_value_reported_to_verified_upgrade: true,
            deadline_metadata: true,
            hidden_reveal: true,
            terminal_states: ['COMPLETED', 'CANCELLED', 'FAILED', 'EXPIRED'],
            v1_event_compatibility: true,
            atomic_verified_resolution: true
          },
          challenge: {
            policy_ref: CHALLENGE_POLICY_REF,
            writable: challengeWritable,
            create_action: challengeWritable ? 'challenge.create' : null,
            atomic_contract_and_quest: challengeWritable,
            atomic_miss_and_recovery: challengeWritable,
            retrofit_existing_quest: false,
            recovery_auto_focus: false,
            reward_multiplier: false
          },
          followthrough: {
            policy_ref: EVIDENCE_FOLLOWTHROUGH_POLICY_REF,
            evaluate_endpoint: '/api/v1/followthrough/evaluate',
            prepares_atomic_resolution: true,
            autonomous_same_trajectory_continuation: true,
            external_writes: false,
            strategic_choices: false
          },
          shop: {
            policy_ref: SHOP_POLICY_REF,
            supported_reward_types: [...SHOP_REWARD_TYPES],
            price_coins: [...SHOP_PRICE_COINS],
            external_value: false,
            protected_needs: false,
            activation_requires_verified_system_fulfillment: true,
            production_mutation_requires_exact_permission: true
          },
          automation: {
            deadline_policy: DEADLINE_POLICY_VERSION,
            startup_sweep: true,
            sweep_interval_ms: deadlineIntervalMs,
            reminders: ['24h', '1h', '15m'],
            automatic_expiry: true,
            challenge_recovery: challengeWritable ? 'preaccepted-atomic-v1' : 'disabled-without-postgres',
            expiry_consequence: 'reward-forfeited',
            in_app_notifications: true,
            web_push: pushDelivery.enabled,
            execution_reminders: {
              policy_ref: EXECUTION_REMINDER_POLICY_REF,
              writable: executionReminderWritable,
              server_side: true,
              requires_open_pwa: false,
              skips_terminal_quests: true
            }
          },
          writes: {
            idempotency_key_required: true,
            shared_database_action_gate: true,
            supported_actions: [
              'quest.create', 'quest.progress', 'quest.reveal', 'quest.complete', 'quest.resolve', 'quest.cancel', 'quest.fail', 'quest.expire',
              ...(challengeWritable ? ['challenge.create'] : []),
              ...(executionReminderWritable ? ['reminder.schedule'] : []),
              'progression.award',
              'profile.calibrate', 'attribute.set', 'skill.upsert', 'achievement.unlock',
              'shop.item.upsert', 'shop.redeem', 'notification.push', 'notification.ack'
            ],
            progression_requires_verified_evidence: true,
            progression_requires_canonical_scored_quest: true,
            calibration_requires_verified_provenance: true,
            shop_redemption_requires_calibrated_economy: true,
            external_live_mutations: 'not performed by this API'
          }
        });
      }

      if (req.method === 'GET' && url.pathname === '/api/v1/events') {
        const limit = Math.max(1, Math.min(Number(url.searchParams.get('limit') || 200), 1000));
        const events = await store.listEvents(limit);
        return json(res, 200, { events });
      }

      if (req.method === 'GET' && url.pathname === '/api/v1/push/public-key') {
        return json(res, 200, { enabled: pushDelivery.enabled, public_key: pushDelivery.publicKey });
      }

      if (req.method === 'POST' && url.pathname === '/api/v1/push/subscriptions') {
        if (!pushDelivery.enabled) return json(res, 503, { error: 'web push is not configured' });
        const subscription = await readJson(req);
        const result = await store.upsertPushSubscription(subscription);
        return json(res, 201, { subscribed: true, ...result });
      }

      if (req.method === 'DELETE' && url.pathname === '/api/v1/push/subscriptions') {
        const body = await readJson(req);
        await store.deletePushSubscription(body.endpoint);
        return json(res, 200, { subscribed: false });
      }

      if (req.method === 'GET' && url.pathname === '/api/v1/snapshot') {
        const events = await store.listAllEvents();
        const snapshot = buildPlayerSnapshot(events);
        return json(res, 200, {
          generated_at: new Date().toISOString(),
          source: 'system-event-ledger',
          model_version: 'quest-v2',
          real_world_authority: 'Ron OS + claim-specific live owners',
          event_count: events.length,
          state: snapshot
        });
      }

      if (req.method === 'POST' && url.pathname === '/api/v1/followthrough/evaluate') {
        const body = await readJson(req);
        const questId = typeof body.quest_id === 'string' ? body.quest_id.trim() : '';
        if (!questId) return json(res, 400, { error: 'quest_id is required' });
        const events = await store.listAllEvents();
        const snapshot = buildPlayerSnapshot(events);
        const quest = snapshot.quests.find((item) => item.id === questId);
        if (!quest) return json(res, 404, { error: 'quest does not exist' });
        const result = evaluateEvidenceFollowthrough({
          quest,
          evidence: body.evidence ?? [],
          completion_evidence: body.completion_evidence ?? null
        });
        return json(res, 200, result);
      }

      if (req.method === 'POST' && url.pathname === '/api/v1/actions') {
        const idempotencyKey = req.headers['idempotency-key'];
        if (typeof idempotencyKey !== 'string' || idempotencyKey.length < 8 || idempotencyKey.length > 200) {
          return json(res, 400, { error: 'Idempotency-Key header (8..200 chars) is required' });
        }
        const action = await readJson(req);
        const context = {
          actor: req.headers['x-system-actor'] || 'chatgpt',
          source: req.headers['x-system-source'] || 'system-api',
          sourceRef: req.headers['x-system-source-ref'] || null
        };
        const result = await store.applyAction(action, context, idempotencyKey);
        return json(res, result.replay ? 200 : 201, result.resolution
          ? { replay: result.replay, event: result.event, events: result.events, resolution: result.resolution }
          : result.challenge
            ? { replay: result.replay, event: result.event, events: result.events, challenge: result.challenge }
            : { replay: result.replay, event: result.event });
      }

      return json(res, 404, { error: 'api route not found' });
    }

    if (req.method === 'GET' || req.method === 'HEAD') {
      if (await serveStatic(url.pathname, res)) return;
      if (!path.extname(url.pathname) && await serveStatic('/', res)) return;
    }
    json(res, 404, { error: 'not found' });
  } catch (error) {
    console.error(error);
    const status = error.code === 'IDEMPOTENCY_CONFLICT' || error.code === '23505' ? 409 : 400;
    json(res, status, { error: error.message || 'request failed' });
  }
});

server.listen(port, '0.0.0.0', () => {
  console.error(`ron-system-core listening on :${port}`);
});

async function shutdown(signal) {
  console.error(`received ${signal}; shutting down`);
  deadlineEngine.stop();
  executionReminderEngine.stop();
  clearInterval(pushTimer);
  server.close(async () => {
    await store.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 5000).unref();
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
