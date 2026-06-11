/**
 * BeritaKarya Service Worker - Per-Site Cache
 *
 * Cache name dibentuk dari site segment URL, sehingga tiap situs
 * punya cache terpisah: beritakarya-pusat-cache-v1, beritakarya-bandung-cache-v1, dst.
 */

const CACHE_VERSION = 'v1';

// Segment URL yang BUKAN site id
const RESERVED_SEGMENTS = new Set([
  'api',
  '_next',
  'icons',
  'logos',
  'p',
  'artikel',
  'penulis',
  'kebijakan-privasi',
  'dashboard',
  'login',
  'register',
  'auth',
  'sw.js',
  'manifest.webmanifest',
  'favicon.ico',
  'favicon.png',
  'placeholder.jpg',
]);

/**
 * Tentukan site id dari sebuah URL.
 * Return 'root' untuk URL root atau path yang tidak dikenali sebagai situs.
 */
function getSiteFromUrl(url) {
  try {
    const path = new URL(url).pathname;
    const segment = path.split('/').filter(Boolean)[0];
    if (!segment) return 'root';
    if (RESERVED_SEGMENTS.has(segment)) return 'root';
    // Sanitasi: hanya alphanumeric & dash
    if (!/^[a-z0-9-]+$/i.test(segment)) return 'root';
    return segment.toLowerCase();
  } catch (e) {
    return 'root';
  }
}

function getCacheName(site) {
  return `beritakarya-${site}-cache-${CACHE_VERSION}`;
}

// Shell bersama (di-share lintas situs)
const SHARED_CACHE = `beritakarya-shared-${CACHE_VERSION}`;
const SHARED_PRECACHE = [
  '/favicon.png',
  '/placeholder.jpg',
];

// Install Event - Pre-cache shared assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHARED_CACHE).then((cache) => {
      return cache.addAll(SHARED_PRECACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Bersihkan cache lama
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Hapus cache beritakarya-* yang bukan versi aktif
          if (
            cacheName.startsWith('beritakarya-') &&
            !cacheName.endsWith(`-${CACHE_VERSION}`) &&
            cacheName !== SHARED_CACHE
          ) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Strategi caching per-situs
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET, external, dan API (auth/cookies sensitive)
  if (
    request.method !== 'GET' ||
    !request.url.startsWith(self.location.origin) ||
    request.url.includes('/api/v1/')
  ) {
    return;
  }

  const site = getSiteFromUrl(request.url);
  const CACHE_NAME = getCacheName(site);

  // Cache-First Strategy untuk static assets
  const isStaticAsset =
    request.url.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|css|js)$/) ||
    request.url.includes('/_next/static/');

  if (isStaticAsset) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request).then((networkResponse) => {
            if (networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            // Fallback untuk gambar yang gagal dimuat
            if (request.url.match(/\.(png|jpg|jpeg|webp)$/)) {
              return caches.match('/placeholder.jpg');
            }
          });
        });
      })
    );
    return;
  }

  // Network-First Strategy untuk HTML & navigasi
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Fallback ke cache saat offline
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Saat offline & membuka HTML, tampilkan shell home situs terkait
          if (request.headers.get('accept')?.includes('text/html')) {
            const homeUrl = site === 'root' ? '/' : `/${site}/`;
            return caches.match(homeUrl);
          }
        });
      })
  );
});
