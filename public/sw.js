const CACHE_NAME = 'vistoriapro-cache-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo192.png',
  '/logo512.png',
  '/favicon.svg',
  '/icons.svg'
];

// Install Event: Precaches core assets immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        await cache.addAll(STATIC_ASSETS);
      } catch (err) {
        console.warn('Falha em alguns assets do pre-cache inicial:', err);
      }
      return self.skipWaiting();
    })
  );
});

// Activate Event: Cleans up old cache versions and claims clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== 'vistoriapro-fonts') {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Cache-First for assets, Network-First with Cache Fallback for navigation
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 1. Google Fonts Caching
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.open('vistoriapro-fonts').then(async (cache) => {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) return cachedResponse;
        try {
          const networkResponse = await fetch(request);
          if (networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (err) {
          return cachedResponse || new Response('', { status: 408 });
        }
      })
    );
    return;
  }

  // 2. Ignore non-origin external API requests (Google Apps Script API, Firebase Auth)
  if (url.origin !== self.location.origin) {
    return;
  }

  // 3. Navigation requests (HTML pages / SPA routing) -> Network first, fallback to cached index.html
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedIndex = (await caches.match('/index.html')) || (await caches.match('/'));
          return (
            cachedIndex ||
            new Response('Offline - VistoriaPro', {
              status: 200,
              headers: { 'Content-Type': 'text/html; charset=utf-8' }
            })
          );
        })
    );
    return;
  }

  // 4. Static Assets (JS, CSS, Images, Icons, SVG) -> Cache-First with Background Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then(async (cachedResponse) => {
      if (cachedResponse) {
        // If online, update cache in background
        if (navigator.onLine) {
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
              }
            })
            .catch(() => {});
        }
        return cachedResponse;
      }

      // Not in cache yet: Fetch from network and save to cache
      try {
        const networkResponse = await fetch(request);
        if (networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
        }
        return networkResponse;
      } catch (err) {
        // Fallback for JS/CSS if offline
        return cachedResponse || new Response('', { status: 408 });
      }
    })
  );
});
