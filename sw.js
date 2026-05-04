const CACHE_NAME = 'suarayi-mecmua-v2';
const ASSETS = [
  'index.html',
  'style.css',
  'main.js',
  'manifest.json'
];

// Yükleme sırasında dosyaları önbelleğe al
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Hata almamak için assets listesini tek tek deniyoruz
      ASSETS.forEach(asset => {
        cache.add(asset).catch(err => console.log('Önbellek atlandı:', asset));
      });
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

// İstekleri önce önbellekten, yoksa internetten getir
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    }).catch(() => fetch(event.request))
  );
});
