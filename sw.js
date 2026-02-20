const CACHE_NAME = 'motopanel-v3';
const STATIC_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-512.png',
  './orbitron.ttf'
];

// INSTALL
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_CACHE))
  );
  self.skipWaiting();
});

// ACTIVATE
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

// FETCH - Cache First com fallback inteligente
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cacheRes => {
      if (cacheRes) return cacheRes;

      return fetch(event.request)
        .then(networkRes => {
          if (networkRes && networkRes.status === 200) {
            const cloned = networkRes.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, cloned);
            });
          }
          return networkRes;
        })
        .catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
    })
  );
});
