// sw.js
// Увеличивайте версию при каждом изменении набора статики
const CACHE = 'calcwood-v12';

// Обязательные ресурсы (критично для работы оффлайн-лендинга)
const PRECACHE_REQUIRED = [
  './',
  './index.html',
  './styles.css',
  './script.js',
  './manifest.webmanifest',
  './sprite.svg',
  './hero.webp',
  './og-image.jpg',
  // Иконки
  './icons/icon-32.png',
  './icons/icon-192.png',
  './icons/icon-256.png',
  './icons/icon-384.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './icons/apple-touch-icon.png',
  './icons/favicon.ico',
  // Обложки
  './covers/glue.webp',
  './covers/fcs.webp',
  './covers/weight.webp',
  './covers/3d.webp',
  './covers/lumber.webp',
  './covers/fasteners.webp'
];

// Опциональные ресурсы (может отсутствовать)
const PRECACHE_OPTIONAL = [
  './offline.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(PRECACHE_REQUIRED);
    await Promise.all(PRECACHE_OPTIONAL.map(u => cache.add(u).catch(() => null)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => (k !== CACHE ? caches.delete(k) : Promise.resolve())));
    await self.clients.claim();
  })());
});

// Стратегии
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  const networkFetch = fetch(request)
    .then((response) => {
      if (response && response.status === 200 && response.type !== 'opaque') {
        cache.put(request, response.clone()).catch(()=>{});
      }
      return response;
    })
    .catch(() => null);
  return cached || networkFetch;
}

async function networkFirstHTML(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      cache.put(request, response.clone()).catch(()=>{});
    }
    return response;
  } catch {
    const offline = await cache.match('./offline.html');
    return offline || new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  let url;
  try { url = new URL(request.url); } catch { return; }
  if (url.origin !== self.location.origin) return;

  const isHTML = request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html');
  if (isHTML) {
    event.respondWith(networkFirstHTML(request));
    return;
  }

  event.respondWith((async () => {
    const response = await staleWhileRevalidate(request);
    if (response) return response;
    const cache = await caches.open(CACHE);
    const offline = await cache.match('./offline.html');
    return offline || new Response('Offline', { status: 503, statusText: 'Offline' });
  })());
});
