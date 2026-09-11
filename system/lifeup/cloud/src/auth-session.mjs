import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE_NAME = '__Host-ron_system_session';
export const PWA_CLIENT_HEADER = 'ron-system-pwa-v1';
const DEFAULT_TTL_DAYS = 180;
const MAX_TTL_DAYS = 365;

function safeEqual(left, right) {
  const a = Buffer.from(String(left ?? ''));
  const b = Buffer.from(String(right ?? ''));
  return a.length === b.length && timingSafeEqual(a, b);
}

function header(headers, name) {
  const value = headers?.[name] ?? headers?.[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

function cookieValue(cookieHeader, name) {
  if (typeof cookieHeader !== 'string') return null;
  for (const part of cookieHeader.split(';')) {
    const index = part.indexOf('=');
    if (index < 1) continue;
    if (part.slice(0, index).trim() === name) return part.slice(index + 1).trim();
  }
  return null;
}

export function normalizeSessionTtlSeconds(value) {
  const parsed = Number(value);
  const days = Number.isFinite(parsed) ? Math.min(MAX_TTL_DAYS, Math.max(1, parsed)) : DEFAULT_TTL_DAYS;
  return Math.round(days * 24 * 60 * 60);
}

export function isTrustedPwaWrite(headers = {}) {
  const origin = header(headers, 'origin');
  const host = header(headers, 'host');
  const forwarded = String(header(headers, 'x-forwarded-proto') || 'http').split(',')[0].trim();
  if (!origin || !host || header(headers, 'x-system-client') !== PWA_CLIENT_HEADER) return false;
  try {
    return new URL(origin).origin === `${forwarded}://${host}`;
  } catch {
    return false;
  }
}

export function createSessionAuth({
  bearer,
  ttlSeconds = normalizeSessionTtlSeconds(),
  now = () => Date.now(),
  randomBytesFn = randomBytes
} = {}) {
  if (!bearer) throw new Error('SYSTEM_BEARER_TOKEN is required');
  const signingKey = createHmac('sha256', bearer).update('ron-system-device-session:v1').digest();

  function signature(payload) {
    return createHmac('sha256', signingKey).update(payload).digest('base64url');
  }

  function verifyBearerHeader(authorization) {
    return typeof authorization === 'string'
      && authorization.startsWith('Bearer ')
      && safeEqual(authorization.slice(7), bearer);
  }

  function verifyBearerValue(value) {
    return safeEqual(value, bearer);
  }

  function mint() {
    const expiresAtSeconds = Math.floor(now() / 1000) + ttlSeconds;
    const payload = `v1.${expiresAtSeconds.toString(36)}.${randomBytesFn(18).toString('base64url')}`;
    const value = `${payload}.${signature(payload)}`;
    return {
      expiresAt: new Date(expiresAtSeconds * 1000).toISOString(),
      value,
      cookie: `${SESSION_COOKIE_NAME}=${value}; Path=/; Max-Age=${ttlSeconds}; Expires=${new Date(expiresAtSeconds * 1000).toUTCString()}; HttpOnly; Secure; SameSite=Strict`
    };
  }

  function verifySessionValue(value) {
    if (typeof value !== 'string') return false;
    const parts = value.split('.');
    if (parts.length !== 4 || parts[0] !== 'v1') return false;
    const payload = parts.slice(0, 3).join('.');
    if (!safeEqual(parts[3], signature(payload))) return false;
    const expiresAtSeconds = Number.parseInt(parts[1], 36);
    return Number.isFinite(expiresAtSeconds) && expiresAtSeconds * 1000 > now();
  }

  function authorize(headers = {}) {
    if (verifyBearerHeader(header(headers, 'authorization'))) return { ok: true, method: 'bearer' };
    const value = cookieValue(header(headers, 'cookie'), SESSION_COOKIE_NAME);
    if (verifySessionValue(value)) return { ok: true, method: 'session' };
    return { ok: false, method: null };
  }

  return {
    authorize,
    mint,
    verifyBearerHeader,
    verifyBearerValue,
    verifySessionValue,
    clearCookie: `${SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Strict`
  };
}
