const CACHE = 'calcwood-v1';
const ASSETS = [
  './','index.html','styles.css','script.js',
  'logo.svg','hero.webp','og-image.jpg',
  'covers/glue.webp','covers/fcs.webp','covers/weight.webp','covers/3d.webp','covers/lumber.webp','covers/fasteners.webp',
  'icons/icon-32.png','icons/icon-192.png','icons/icon-512.png','icons/maskable-512.png'
];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e=>{
  const req = e.request, url = new URL(req.url);
  if(url.origin !== self.location.origin) return;
  if(req.mode === 'navigate'){
    e.respondWith(fetch(req).then(res=>{
      caches.open(CACHE).then(c=>c.put('index.html', res.clone()));
      return res;
    }).catch(()=>caches.match('index.html')));
    return;
  }
  e.respondWith(caches.match(req).then(c=>c || fetch(req).then(res=>{
    caches.open(CACHE).then(cache=>cache.put(req, res.clone()));
    return res;
  })));
});
