// DMC Hub Service Worker (PWA Offline Field Support)
const CACHE_NAME = 'dmc-hub-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css?v=1.5',
  './data.js?v=2.0',
  './gis_data.js',
  './app.js?v=1.5',
  './xlsx.full.min.js',
  './manifest.json',
  './garuda.png',
  './banner_dmc_hub_400x150.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching core DMC Hub assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).catch(err => console.log('[Service Worker] Install caching failed:', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[Service Worker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Network first, fall back to cache for data freshness
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
