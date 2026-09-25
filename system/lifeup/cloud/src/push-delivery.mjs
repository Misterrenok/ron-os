import { createECDH } from 'node:crypto';

function deriveVapidPublicKey(privateKey) {
  if (!privateKey) return '';
  try {
    const raw = Buffer.from(privateKey, 'base64url');
    if (raw.length !== 32) return '';
    const ecdh = createECDH('prime256v1');
    ecdh.setPrivateKey(raw);
    return ecdh.getPublicKey('base64url', 'uncompressed');
  } catch {
    return '';
  }
}

export function pushConfiguration(env = process.env) {
  const configuredPublicKey = env.VAPID_PUBLIC_KEY?.trim() || '';
  const privateKey = env.VAPID_PRIVATE_KEY?.trim() || '';
  const subject = env.VAPID_SUBJECT?.trim() || '';
  const derivedPublicKey = deriveVapidPublicKey(privateKey);
  const publicKey = derivedPublicKey || configuredPublicKey;
  return {
    enabled: Boolean(publicKey && privateKey && subject && derivedPublicKey),
    publicKey,
    configuredPublicKey,
    publicKeyRepaired: Boolean(derivedPublicKey && configuredPublicKey && derivedPublicKey !== configuredPublicKey),
    privateKey,
    subject
  };
}

export function describePushError(error) {
  const parts = [String(error?.message || 'push failed')];
  if (Number.isFinite(Number(error?.statusCode))) parts.push(`status=${Number(error.statusCode)}`);
  if (error?.body != null) {
    const body = Buffer.isBuffer(error.body) ? error.body.toString('utf8') : String(error.body);
    if (body.trim()) parts.push(`body=${body.trim().slice(0, 300)}`);
  }
  return parts.join(' | ').slice(0, 500);
}

export async function createPushDelivery({ store, env = process.env, importWebPush = () => import('web-push'), log = console.error } = {}) {
  const config = pushConfiguration(env);
  if (!config.enabled) {
    return { enabled: false, publicKey: config.publicKey || null, publicKeyRepaired: false, async enqueueAndDrain() {}, async drain() {} };
  }

  const module = await importWebPush();
  const webpush = module.default ?? module;
  webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);

  async function drain() {
    await store.enqueuePushDeliveries();
    for (;;) {
      const claims = await store.claimPushDeliveries(20);
      if (!claims.length) break;
      for (const claim of claims) {
        try {
          await webpush.sendNotification(
            { endpoint: claim.endpoint, keys: { p256dh: claim.p256dh, auth: claim.auth } },
            JSON.stringify(claim.payload),
            { TTL: 3600, urgency: claim.payload?.severity === 'CRITICAL' ? 'high' : 'normal', topic: claim.topic }
          );
          await store.finishPushDelivery(claim, { sent: true });
        } catch (error) {
          const gone = error?.statusCode === 404 || error?.statusCode === 410;
          await store.finishPushDelivery(claim, { sent: false, gone, error: describePushError(error) });
          if (!gone) log(error);
        }
      }
    }
  }

  return {
    enabled: true,
    publicKey: config.publicKey,
    publicKeyRepaired: config.publicKeyRepaired,
    async enqueueAndDrain() { await drain(); },
    drain
  };
}
