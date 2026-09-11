import { createServer } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyCalibrationProjection, CALIBRATION_REFS } from './calibration.mjs';
import { buildSnapshot } from './model.mjs';
import { createStore } from './store.mjs';

const port = Number(process.env.PORT || 8080);
const bearer = process.env.SYSTEM_BEARER_TOKEN?.trim();
if (!bearer) throw new Error('SYSTEM_BEARER_TOKEN is required');

const publicDir = fileURLToPath(new URL('../public/', import.meta.url));
const store = await createStore();
await store.init();

function authorized(header) {
  if (!header?.startsWith('Bearer ')) return false;
  const supplied = Buffer.from(header.slice(7));
  const expected = Buffer.from(bearer);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

function json(res, status, body, headers = {}) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers });
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
    '.webmanifest': 'application/manifest+json',
    '.svg': 'image/svg+xml'
  })[ext] || 'application/octet-stream';
}

async function serveStatic(urlPath, res) {
  const safePath = urlPath === '/' ? '/index.html' : urlPath;
  const normalized = path.normalize(safePath).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(publicDir, normalized);
  if (!filePath.startsWith(publicDir)) return false;
  try {
    const body = await fs.readFile(filePath);
    res.writeHead(200, { 'content-type': mime(filePath), 'cache-control': safePath === '/index.html' ? 'no-cache' : 'public, max-age=300' });
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
        model_version: 'calibration-v1',
        phone_dependency: false
      });
    }

    if (url.pathname.startsWith('/api/')) {
      if (!authorized(req.headers.authorization)) {
        return json(res, 401, { error: 'unauthorized' }, { 'www-authenticate': 'Bearer' });
      }

      if (req.method === 'GET' && url.pathname === '/api/v1/capabilities') {
        return json(res, 200, {
          version: 'v1',
          model_version: 'calibration-v1',
          calibration: {
            level_policy_ref: CALIBRATION_REFS.level,
            reward_policy_ref: CALIBRATION_REFS.reward,
            attribute_scale_ref: CALIBRATION_REFS.attribute,
            skill_scale_ref: CALIBRATION_REFS.skill,
            rank_policy_ref: CALIBRATION_REFS.rank,
            unknown_is_null: true,
            retroactive_xp: false
          },
          writes: {
            idempotency_key_required: true,
            shared_database_action_gate: true,
            supported_actions: [
              'quest.create', 'quest.complete', 'quest.cancel', 'progression.award',
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

      if (req.method === 'GET' && url.pathname === '/api/v1/snapshot') {
        const events = await store.listAllEvents();
        const snapshot = applyCalibrationProjection(buildSnapshot(events));
        return json(res, 200, {
          generated_at: new Date().toISOString(),
          source: 'system-event-ledger',
          model_version: 'calibration-v1',
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
        return json(res, result.replay ? 200 : 201, { replay: result.replay, event: result.event });
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
  server.close(async () => {
    await store.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 5000).unref();
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
