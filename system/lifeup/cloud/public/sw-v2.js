const CACHE = 'ron-system-shell-v18';
const SHELL = ['/', '/styles.css', '/quest-v2.css', '/cosmetic-effects.css', '/ui-polish.css', '/app-v2.js', '/player-utility.js', '/notification-actions.js', '/snapshot-refresh.js', '/view-navigation.js', '/projection.js', '/strategy-context.js', '/challenge-timing-view.js', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('ron-system-shell-') && key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
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
