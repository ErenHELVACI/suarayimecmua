const CACHE_NAME = 'suarayi-mecmua-v3';
const ASSETS = [
  'index.html',
  'auth.html',
  'paylasim.html',
  'kesif.html',
  'style.css',
  'main.js',
  'manifest.json',
  'assets/icon-192.png',
  'assets/icon-512.png'
];

// Yükleme sırasında dosyaları önbelleğe al
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(err => {
          console.log('Bazı dosyalar önbelleğe alınamadı:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Eski önbellekleri temizle
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// İstekleri önce internetten, yoksa önbellekten getir (Stale-While-Revalidate yaklaşımı)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request).then(networkResponse => {
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, networkResponse.clone());
        });
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
