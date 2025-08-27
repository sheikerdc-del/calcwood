// Версию меняйте при изменении набора статических файлов
const CACHE = 'calcwood-v3';

const PRECACHE_URLS = [
  './',
  './index.html',
  './styles.css',
  './script.js',
  './manifest.webmanifest',
  './hero.webp',
  './og-image.jpg',
  // Иконки
  './icons/icon-32.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './icons/favicon.ico',
  // Каверы
  './covers/glue.webp',
  './covers/fcs.webp',
  './covers/weight.webp',
  './covers/3d.webp',
  './covers/lumber.webp',
  './covers/fasteners.webp',
  // Лого (если у вас оно в корне, иначе удалите/исправьте)
  './logo.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Удаляем старые кэши
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => (k !== CACHE ? caches.delete(k) : Promise.resolve())));
      await self.clients.claim();
    })()
  );
});

// Помощник: stale-while-revalidate для запросов того же origin
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  const networkFetch = fetch(request).then((response) => {
    // Успешный ответ — обновим кэш
    if (response && response.status === 200 && response.type !== 'opaque') {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);

  // Отдаём кэш сразу, если есть, иначе ждём сеть
  return cached || networkFetch;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Только GET
  if (request.method !== 'GET') return;

  // Не трогаем кросс-оригин (калькуляторы на onrender.com и т.п.)
  try {
    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;

    // Для нашей статики — stale-while-revalidate
    event.respondWith(staleWhileRevalidate(request));
  } catch {
    // В случае недопарсенного URL просто игнорируем
  }
});
