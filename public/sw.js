// Self-unregistering and cache-clearing script to prevent stale Vite dev / production bundles
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((k) => caches.delete(k)));
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Pass through all fetch requests directly to network
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
