const CACHE_NAME = 'ttc-app-cache-v1';
const urlsToCache = [
    'index.html',
    'style.css',
    'script.js',
    'stops.csv',
    'assets/ttc_streetcar.webp',
    'assets/ttc_bus.webp',
    'assets/ttc_all.webp',
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response; // Return cached response if available
                }
                return fetch(event.request); // Fetch from network if not cached
            })
    );
});