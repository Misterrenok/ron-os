import { createServer } from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyCalibrationProjection, CALIBRATION_REFS } from './calibration.mjs';
import { buildSnapshot } from './quest-v2.mjs';
import { createStore } from './resolution-store.mjs';
import { DEADLINE_POLICY_VERSION, normalizeDeadlineInterval, startDeadlineEngine } from './deadline-engine.mjs';
import { createPushDelivery } from './push-delivery.mjs';
import { createSessionAuth, isTrustedPwaWrite, normalizeSessionTtlSeconds } from './auth-session.mjs';

const port = Number(process.env.PORT || 8080);
const bearer = process.env.SYSTEM_BEARER_TOKEN?.trim();
if (!bearer) throw new Error('SYSTEM_BEARER_TOKEN is required');
const sessionAuth = createSessionAuth({
  bearer,
  ttlSeconds: normalizeSessionTtlSeconds(process.env.SYSTEM_SESSION_TTL_DAYS)
});

const publicDir = fileURLToPath(new URL('../public/', import.meta.url));
const store = await createStore();
await store.init();
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
  res.writeHead(status, { ...securityHeaders, 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers });
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
    res.writeHead(200, { ...securityHeaders, 'content-type': mime(filePath), 'cache-control': safePath === '/index-v2.html' ? 'no-cache' : 'public, max-age=300' });
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
        web_push: pushDelivery.enabled ? 'enabled' : 'disabled',
        interface_locale: 'ru-RU',
        device_session: 'signed-http-only-v1',
        phone_dependency: false
      });
    }

    if (url.pathname === '/api/v1/session') {
      if (req.method === 'GET') {
        const auth = sessionAuth.authorize(req.headers);
        return json(res, 200, { connected: auth.ok, method: auth.method });
      }
      if (req.method === 'POST') {
        if (!isTrustedPwaWrite(req.headers)) return json(res, 403, { error: 'untrusted session request' });
        const body = await readJson(req);
        if (!sessionAuth.verifyBearerValue(body.token)) {
          return json(res, 401, { error: 'unauthorized' }, { 'www-authenticate': 'Bearer' });
        }
        const session = sessionAuth.mint();
        return json(res, 201, { connected: true, expires_at: session.expiresAt }, { 'set-cookie': session.cookie });
      }
      if (req.method === 'DELETE') {
        if (!isTrustedPwaWrite(req.headers)) return json(res, 403, { error: 'untrusted session request' });
        return json(res, 200, { connected: false }, { 'set-cookie': sessionAuth.clearCookie });
      }
      return json(res, 405, { error: 'method not allowed' }, { allow: 'GET, POST, DELETE' });
    }

    if (url.pathname.startsWith('/api/')) {
      const auth = sessionAuth.authorize(req.headers);
      if (!auth.ok) {
        return json(res, 401, { error: 'unauthorized' }, { 'www-authenticate': 'Bearer' });
      }
      if (!['GET', 'HEAD'].includes(req.method) && auth.method === 'session' && !isTrustedPwaWrite(req.headers)) {
        return json(res, 403, { error: 'untrusted session write' });
      }

      if (req.method === 'GET' && url.pathname === '/api/v1/capabilities') {
        return json(res, 200, {
          version: 'v1',
          model_version: 'quest-v2',
          backward_compatible_with: ['calibration-v1', 'quest-v1'],
          authentication: {
            bearer_clients: true,
            persistent_device_session: 'signed-http-only-v1',
            session_cookie_http_only: true,
            session_cookie_same_site: 'Strict',
            default_session_days: 180
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
            deadline_metadata: true,
            hidden_reveal: true,
            terminal_states: ['COMPLETED', 'CANCELLED', 'FAILED', 'EXPIRED'],
            v1_event_compatibility: true,
            atomic_verified_resolution: true
          },
          automation: {
            deadline_policy: DEADLINE_POLICY_VERSION,
            startup_sweep: true,
            sweep_interval_ms: deadlineIntervalMs,
            reminders: ['24h', '1h', '15m'],
            automatic_expiry: true,
            expiry_consequence: 'reward-forfeited',
            in_app_notifications: true,
            web_push: pushDelivery.enabled
          },
          writes: {
            idempotency_key_required: true,
            shared_database_action_gate: true,
            supported_actions: [
              'quest.create', 'quest.progress', 'quest.reveal', 'quest.complete', 'quest.resolve', 'quest.cancel', 'quest.fail', 'quest.expire',
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
        const snapshot = applyCalibrationProjection(buildSnapshot(events));
        return json(res, 200, {
          generated_at: new Date().toISOString(),
          source: 'system-event-ledger',
          model_version: 'quest-v2',
          real_world_authority: 'Ron OS + claim-specific live owners',
          event_count: events.length,
          state: snapshot
        });
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
  clearInterval(pushTimer);
  server.close(async () => {
    await store.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 5000).unref();
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
