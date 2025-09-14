// Service Worker for aggressive caching and performance
const CACHE_NAME = 'aspirely-v1';
const STATIC_CACHE = 'aspirely-static-v1';
const DYNAMIC_CACHE = 'aspirely-dynamic-v1';

// Critical assets to cache immediately
const CRITICAL_ASSETS = [
  '/',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// Cache strategies for different resource types
const CACHE_STRATEGIES = {
  // Images: Cache first, network fallback
  images: /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i,
  // Fonts: Cache first
  fonts: /\.(woff|woff2|eot|ttf|otf)$/i,
  // CSS/JS: Stale while revalidate
  assets: /\.(css|js)$/i,
  // API calls: Network first, cache fallback
  api: /\/api\//i
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(CRITICAL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheName.includes('aspirely-')) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Handle different resource types
  if (CACHE_STRATEGIES.images.test(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else if (CACHE_STRATEGIES.fonts.test(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else if (CACHE_STRATEGIES.assets.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
  } else if (url.origin === self.location.origin) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
  }
});

// Cache strategies
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Network error', { status: 408 });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  const fetchPromise = fetch(request).then(response => {
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  });
  
  return cached || fetchPromise;
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}