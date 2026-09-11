import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PWA_CLIENT_HEADER,
  SESSION_COOKIE_NAME,
  createSessionAuth,
  isTrustedPwaWrite,
  normalizeSessionTtlSeconds
} from '../src/auth-session.mjs';

const fixedRandom = () => Buffer.alloc(18, 7);

test('session TTL is durable but bounded', () => {
  assert.equal(normalizeSessionTtlSeconds(), 180 * 86_400);
  assert.equal(normalizeSessionTtlSeconds(0), 86_400);
  assert.equal(normalizeSessionTtlSeconds(999), 365 * 86_400);
});

test('Bearer access remains valid and timing-safe comparison rejects wrong values', () => {
  const auth = createSessionAuth({ bearer: 'correct-secret' });
  assert.deepEqual(auth.authorize({ authorization: 'Bearer correct-secret' }), { ok: true, method: 'bearer' });
  assert.deepEqual(auth.authorize({ authorization: 'Bearer wrong' }), { ok: false, method: null });
});

test('minted device session is signed, persistent and HttpOnly', () => {
  let instant = Date.parse('2026-09-12T00:00:00Z');
  const auth = createSessionAuth({ bearer: 'correct-secret', ttlSeconds: 3600, now: () => instant, randomBytesFn: fixedRandom });
  const session = auth.mint();
  assert.match(session.cookie, new RegExp(`^${SESSION_COOKIE_NAME}=`));
  assert.match(session.cookie, /HttpOnly/);
  assert.match(session.cookie, /Secure/);
  assert.match(session.cookie, /SameSite=Strict/);
  assert.match(auth.clearCookie, /Max-Age=0/);
  assert.deepEqual(auth.authorize({ cookie: `${SESSION_COOKIE_NAME}=${session.value}` }), { ok: true, method: 'session' });

  const tampered = `${session.value.slice(0, -1)}x`;
  assert.equal(auth.verifySessionValue(tampered), false);
  instant += 3_600_000;
  assert.equal(auth.verifySessionValue(session.value), false);
});

test('cookie-authenticated writes require exact same-origin PWA proof', () => {
  const base = {
    host: 'system.example',
    origin: 'https://system.example',
    'x-forwarded-proto': 'https',
    'x-system-client': PWA_CLIENT_HEADER
  };
  assert.equal(isTrustedPwaWrite(base), true);
  assert.equal(isTrustedPwaWrite({ ...base, origin: 'https://evil.example' }), false);
  assert.equal(isTrustedPwaWrite({ ...base, origin: undefined }), false);
  assert.equal(isTrustedPwaWrite({ ...base, 'x-system-client': undefined }), false);
});
