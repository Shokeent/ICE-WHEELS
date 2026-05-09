const CACHE_NAME = 'ice-wheels-v1';
const SHELL = [
    '/index.html',
    '/locations.html',
    '/map.html',
    '/about.html',
    '/contact.html',
    '/faq.html',
    '/details.html',
    '/manifest.json',
    '/css/styles.css',
    '/script/data.js',
    '/script/script.js',
    '/script/locations.js',
    '/script/map.js',
    '/script/details.js',
];

self.addEventListener('install', function(e) {
    e.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) { return cache.addAll(SHELL); })
            .then(function() { return self.skipWaiting(); })
    );
});

self.addEventListener('activate', function(e) {
    e.waitUntil(
        caches.keys().then(function(keys) {
            return Promise.all(
                keys.filter(function(k) { return k !== CACHE_NAME; })
                    .map(function(k) { return caches.delete(k); })
            );
        }).then(function() { return self.clients.claim(); })
    );
});

self.addEventListener('fetch', function(e) {
    if (new URL(e.request.url).origin !== self.location.origin) return;
    e.respondWith(
        caches.match(e.request).then(function(cached) {
            if (cached) return cached;
            return fetch(e.request).then(function(response) {
                if (response && response.ok) {
                    var clone = response.clone();
                    caches.open(CACHE_NAME).then(function(cache) { cache.put(e.request, clone); });
                }
                return response;
            });
        })
    );
});
