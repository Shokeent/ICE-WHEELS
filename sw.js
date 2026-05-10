const CACHE_NAME = 'ice-wheels-v3';

// Only pre-cache HTML + CSS — JS is always fetched fresh so updates propagate instantly
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
    '/images/ice-skating.jpg',
    '/images/ice-skating.jpeg',
    '/images/harbourfront.jpg',
    '/images/nathan-phillips.jpg',
    '/images/bentway.jpg',
    '/images/greenwood.jpg',
    '/images/rollerskating.jpg',
    '/images/rollerskating2.jpg',
    '/images/waterfront-trail.jpg',
    '/images/north-york-civic.jpg',
    '/images/scarborough-civic.jpg',
    '/images/north-york-roll.jpg',
    '/images/riverdale-roller.jpg',
    '/images/urban-roller.jpg',
    '/images/roller-skate.jpg',
    '/images/ice-skate-close.jpg',
    '/images/colonel-smith.jpg',
    '/images/west-end-wheels.jpg',
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
    var url = new URL(e.request.url);

    // Pass through cross-origin (CDN fonts, leaflet, etc.)
    if (url.origin !== self.location.origin) return;

    // Never cache API routes — always go to network
    if (url.pathname.startsWith('/api/')) return;

    // Never cache JS files — always go to network so updates are instant
    if (url.pathname.endsWith('.js')) return;

    // Network-first for HTML
    if (e.request.destination === 'document') {
        e.respondWith(
            fetch(e.request).then(function(response) {
                if (response && response.ok) {
                    var clone = response.clone();
                    caches.open(CACHE_NAME).then(function(c) { c.put(e.request, clone); });
                }
                return response;
            }).catch(function() {
                return caches.match(e.request);
            })
        );
        return;
    }

    // Cache-first for CSS and images
    e.respondWith(
        caches.match(e.request).then(function(cached) {
            if (cached) return cached;
            return fetch(e.request).then(function(response) {
                if (response && response.ok) {
                    var clone = response.clone();
                    caches.open(CACHE_NAME).then(function(c) { c.put(e.request, clone); });
                }
                return response;
            });
        })
    );
});
