const CACHE = 'ron-system-shell-v22';
const SHELL = ['/', '/styles.css', '/quest-v2.css', '/cosmetic-effects.css', '/ui-polish.css', '/app-v2.js', '/cosmetic-effects.js', '/player-utility.js', '/notification-actions.js', '/snapshot-refresh.js', '/view-navigation.js', '/projection.js', '/strategy-context.js', '/challenge-timing-view.js', '/push-key-rotation.js', '/manifest.webmanifest'];


function base64UrlToUint8Array(value) {
  const padding = '='.repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

function applicationServerKeyBase64(subscription) {
  const key = subscription?.options?.applicationServerKey;
  if (!key) return '';
  const bytes = key instanceof ArrayBuffer ? new Uint8Array(key) : new Uint8Array(key.buffer, key.byteOffset, key.byteLength);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function registerPushSubscription(subscription) {
  await fetch('/api/v1/push/subscriptions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-system-client': 'ron-system-sw-v1' },
    credentials: 'omit',
    cache: 'no-store',
    body: JSON.stringify(subscription.toJSON())
  });
}

async function repairPushSubscriptionKey() {
  const configResponse = await fetch('/api/v1/push/public-key', { credentials: 'omit', cache: 'no-store' });
  if (!configResponse.ok) return false;
  const config = await configResponse.json();
  if (!config?.enabled || !config.public_key) return false;
  const current = await self.registration.pushManager.getSubscription();
  if (!current) return false;
  if (applicationServerKeyBase64(current) === config.public_key) return true;
  await current.unsubscribe();
  const fresh = await self.registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: base64UrlToUint8Array(config.public_key)
  });
  await registerPushSubscription(fresh);
  return true;
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('ron-system-shell-') && key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
      .then(() => repairPushSubscriptionKey().catch(() => false))
  );
});

self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil((async () => {
    const response = await fetch('/api/v1/push/public-key', { credentials: 'omit', cache: 'no-store' });
    if (!response.ok) return;
    const config = await response.json();
    if (!config?.enabled || !config.public_key) return;
    const fresh = await self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToUint8Array(config.public_key)
    });
    await registerPushSubscription(fresh);
  })().catch(() => {}));
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !SHELL.includes(url.pathname)) return;
  const shellNavigation = event.request.mode === 'navigate' && url.pathname === '/';
  const cacheKey = shellNavigation ? '/' : event.request;
  event.respondWith(
    fetch(event.request, { cache: 'no-store' })
      .then((response) => {
        if (response.ok && !response.redirected) {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE).then((cache) => cache.put(cacheKey, copy)).catch(() => {}));
        }
        return response;
      })
      .catch(async () => (await (await caches.open(CACHE)).match(cacheKey)) || Response.error())
  );
});

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data?.json() ?? {}; } catch { data = { title: 'Система', body: event.data?.text() ?? '' }; }
  event.waitUntil(self.registration.showNotification(data.title || 'Система', {
    body: data.body || '',
    tag: data.notification_id || 'system-notification',
    renotify: true,
    data: { url: data.url || '/?view=notifications' }
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '/?view=notifications', self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const existing = windows.find((client) => client.url.startsWith(self.location.origin));
      if (existing) {
        existing.navigate(target);
        return existing.focus();
      }
      return self.clients.openWindow(target);
    })
  );
});
