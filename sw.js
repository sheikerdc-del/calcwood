// Увеличивайте версию при каждом изменении набора статики
const CACHE = 'calcwood-v5';

const PRECACHE_URLS = [
  './',
  './index.html',
  './styles.css',
  './script.js',
  './manifest.webmanifest',
  './hero.webp',
  './og-image.jpg',
  './offline.html',
  // Иконки
  './icons/icon-32.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './icons/favicon.ico',
  // Обложки
  './covers/glue.webp',
  './covers/fcs.webp',
  './covers/weight.webp',
  './covers/3d.webp',
  './covers/lumber.webp',
  './covers/fasteners.webp',
  // Лого
  './logo.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => (k !== CACHE ? caches.delete(k) : Promise.resolve())));
    await self.clients.claim();
  })());
});

// Stale-while-revalidate для того же origin
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  const networkFetch = fetch(request).then((response) => {
    if (response && response.status === 200 && response.type !== 'opaque') {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);
  return cached || networkFetch;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  try {
    const url = new URL(request.url);
    // Кросс-оригин (внешние калькуляторы) не перехватываем
    if (url.origin !== self.location.origin) return;

    // Основная стратегия
    event.respondWith((async () => {
      const response = await staleWhileRevalidate(request);
      if (response) return response;
      // Фолбэк офлайн
      const cache = await caches.open(CACHE);
      const offline = await cache.match('./offline.html');
      return offline || new Response('Offline', { status: 503, statusText: 'Offline' });
    })());
  } catch {
    // Если URL не распарсился — ничего не делаем
  }
});
