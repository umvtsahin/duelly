const cacheName = 'brain-battle-v1';
const assets = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './genelkultur.js',
  './tarih.js',
  './matematik.js',
  './bilim.js',
  './sinema.js',
  './spor.js',
  'https://unpkg.com/peerjs@1.4.7/dist/peerjs.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(cacheName).then(cache => {
      return cache.addAll(assets);
    })
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(res => {
      return res || fetch(e.request);
    })
  );
});
