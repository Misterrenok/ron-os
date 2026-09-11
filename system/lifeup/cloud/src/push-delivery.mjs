export function pushConfiguration(env = process.env) {
  const publicKey = env.VAPID_PUBLIC_KEY?.trim() || '';
  const privateKey = env.VAPID_PRIVATE_KEY?.trim() || '';
  const subject = env.VAPID_SUBJECT?.trim() || '';
  return {
    enabled: Boolean(publicKey && privateKey && subject),
    publicKey,
    privateKey,
    subject
  };
}

export async function createPushDelivery({ store, env = process.env, importWebPush = () => import('web-push'), log = console.error } = {}) {
  const config = pushConfiguration(env);
  if (!config.enabled) {
    return { enabled: false, publicKey: config.publicKey || null, async enqueueAndDrain() {}, async drain() {} };
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
          await store.finishPushDelivery(claim, { sent: false, gone, error: error?.message || 'push failed' });
          if (!gone) log(error);
        }
      }
    }
  }

  return {
    enabled: true,
    publicKey: config.publicKey,
    async enqueueAndDrain() { await drain(); },
    drain
  };
}
