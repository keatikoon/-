// FarmMeth Service Worker
const CACHE = 'farmmeth-v2';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Firebase / Cloudinary / Telegram → network only (skip cache)
  if (url.hostname.includes('googleapis') ||
      url.hostname.includes('firestore') ||
      url.hostname.includes('cloudinary') ||
      url.hostname.includes('telegram') ||
      url.hostname.includes('firebaseio')) return;
  // Static assets → cache first, then network
  e.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(e.request).then(cached => {
        const fetchPromise = fetch(e.request).then(res => {
          if (res.ok && res.status === 200) cache.put(e.request, res.clone());
          return res;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    )
  );
});
