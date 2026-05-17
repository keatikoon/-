// FarmMeth Service Worker v5
const CACHE = 'farmmeth-v5';

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

  // Skip caching for Firebase / Cloudinary / Telegram / LINE proxy
  if (url.hostname.includes('googleapis') ||
      url.hostname.includes('firestore') ||
      url.hostname.includes('cloudinary') ||
      url.hostname.includes('telegram') ||
      url.hostname.includes('firebaseio') ||
      url.hostname.includes('workers.dev')) return;

  // HTML, manifest, service worker → network-first (เพื่อให้ user ได้ version ใหม่เสมอ)
  const isHtmlLike = e.request.mode === 'navigate' ||
    e.request.destination === 'document' ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('/') ||
    url.pathname.endsWith('manifest.json') ||
    url.pathname.endsWith('sw.js');

  if (isHtmlLike) {
    e.respondWith(
      fetch(e.request).then(res => {
        if (res.ok && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // Static assets (icons, etc.) → cache-first
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
