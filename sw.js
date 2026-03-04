const CACHE_NAME = 'kids-tracer-v3';
const ASSETS_TO_CACHE = [
  '/kids-learning-app/',
  '/kids-learning-app/index.html',
  '/kids-learning-app/app.js',
  '/kids-learning-app/manifest.json',
  '/kids-learning-app/icon-192.png',
  '/kids-learning-app/icon-512.png'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
      caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
    );
});
  
self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => response || fetch(e.request))
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    return caches.delete(key);
                }
            }));
        })
    );
});
