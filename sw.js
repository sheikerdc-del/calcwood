// javascript
// Увеличивайте версию при каждом изменении набора статики
const CACHE = 'calcwood-v8';

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
  // Иконки (минимальный набор)
  './icons/icon-32.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './icons/favicon.ico',
  // Обложки (используются на карточках)
  './covers/glue.webp',
  './covers/fcs.webp',
  './covers/weight.webp',
  './covers/3d.webp',
  './covers/lumber.webp',
  './covers/fasteners.webp'
];

// Опциональные ресурсы (может отсутствовать; не ломают инсталляцию)
const PRECACHE_OPTIONAL = [
  './offline.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Обязательная статика: если чего-то нет — установка провалится (ожидаем наличие)
    await cache.addAll(PRECACHE_REQUIRED);
    // Опциональная статика: пытаемся добавить, игнорируем ошибки, чтобы не ломать install
    await Promise.all(
      PRECACHE_OPTIONAL.map(url =>
        cache.add(url).catch(() => null)
      )
    );
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.map((k) => (k !== CACHE ? caches.delete(k) : Promise.resolve()))
    );
    await self.clients.claim();
  })());
});

// Stale-while-revalidate для статики (CSS/JS/изображения и т.п.)
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  const networkFetch = fetch(request)
    .then((response) => {
      // Кэшируем только успешные и не-opaque ответы
      if (response && response.status === 200 && response.type !== 'opaque') {
        cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    })
    .catch(() => null);
  return cached || networkFetch;
}

// Network-first для HTML/навегации с офлайн-фолбэком
async function networkFirstHTML(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      cache.put(request, response.clone()).catch(() => {});
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
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // Кросс-оригин (внешние калькуляторы) не перехватываем
  if (url.origin !== self.location.origin) return;

  // Навигационные запросы/HTML — network-first с офлайн-фолбэком
  const isHTML =
    request.mode === 'navigate' ||
    (request.headers.get('accept') || '').includes('text/html');

  if (isHTML) {
    event.respondWith(networkFirstHTML(request));
    return;
  }

  // Остальная статика — stale-while-revalidate
  event.respondWith((async () => {
    const response = await staleWhileRevalidate(request);
    if (response) return response;
    // Фолбэк офлайн (если запросили что-то непредусмотренное и ничего не нашли)
    const cache = await caches.open(CACHE);
    const offline = await cache.match('./offline.html');
    return offline || new Response('Offline', { status: 503, statusText: 'Offline' });
  })());
});
