const CACHE_NAME = 'moto-pwa-v2';
const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/manifest.json'
];

self.addEventListener('install', evt=>{
    evt.waitUntil(
        caches.open(CACHE_NAME).then(cache=>{
            console.log('Arquivos em cache');
            return cache.addAll(FILES_TO_CACHE);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', evt=>{
    evt.waitUntil(
        caches.keys().then(keys=>{
            return Promise.all(keys.map(k=>{
                if(k!==CACHE_NAME) return caches.delete(k);
            }));
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', evt=>{
    evt.respondWith(
        caches.match(evt.request).then(resp=>resp || fetch(evt.request))
    );
});
