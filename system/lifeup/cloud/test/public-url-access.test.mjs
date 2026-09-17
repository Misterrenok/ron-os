import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const cloudRoot = fileURLToPath(new URL('../', import.meta.url));
const port = 18093;
const base = `http://127.0.0.1:${port}`;

async function waitForServer(child) {
  let stderr = '';
  child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (child.exitCode != null) throw new Error(`server exited early (${child.exitCode})\n${stderr}`);
    try {
      const response = await fetch(`${base}/healthz`);
      if (response.ok) return { response, stderr: () => stderr };
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`server did not become ready\n${stderr}`);
}

test('canonical cloud runtime needs only the URL, not bearer/password/session credentials', async (t) => {
  const child = spawn(process.execPath, ['src/server-v2.mjs'], {
    cwd: cloudRoot,
    env: {
      ...process.env,
      PORT: String(port),
      SYSTEM_ALLOW_EPHEMERAL: '1',
      DEADLINE_SWEEP_INTERVAL_MS: '5000'
    },
    stdio: ['ignore', 'ignore', 'pipe']
  });
  t.after(() => {
    if (child.exitCode == null) child.kill('SIGTERM');
  });

  const { response: healthResponse, stderr } = await waitForServer(child);
  const health = await healthResponse.json();
  assert.equal(health.access_mode, 'public-url');
  assert.equal(health.authentication_required, false);
  assert.equal(health.device_session, 'not-required');

  const capabilitiesResponse = await fetch(`${base}/api/v1/capabilities`);
  assert.equal(capabilitiesResponse.status, 200);
  const capabilities = await capabilitiesResponse.json();
  assert.deepEqual(capabilities.access, {
    mode: 'public-url',
    authentication_required: false,
    bearer_token: false,
    password: false,
    device_session: false
  });

  const snapshotResponse = await fetch(`${base}/api/v1/snapshot`);
  assert.equal(snapshotResponse.status, 200);
  const snapshot = await snapshotResponse.json();
  assert.equal(snapshot.model_version, 'quest-v2');
  assert.ok(snapshot.state);

  const retiredSession = await fetch(`${base}/api/v1/session`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}'
  });
  assert.equal(retiredSession.status, 404);
  assert.equal(retiredSession.headers.get('set-cookie'), null);
  assert.deepEqual(await retiredSession.json(), {
    error: 'api route not found'
  });

  const missingIdempotency = await fetch(`${base}/api/v1/actions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type: 'quest.create', payload: { quest_id: 'no-key-q1', title: 'No key' } })
  });
  assert.equal(missingIdempotency.status, 400);
  assert.match((await missingIdempotency.json()).error, /Idempotency-Key/);

  assert.equal(child.exitCode, null, stderr());
});
