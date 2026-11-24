/**
 * Service Worker 100% Offline-First para TopoPiscícola Pro
 * Totalmente compatible con subcarpetas en GitHub Pages (ej. /nivelacion-lagos/)
 */

const CACHE_NAME = 'topolago-ghpages-v1.2.0';

const ASSETS_RELATIVE = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/db.js',
  './js/topo-math.js',
  './js/app.js',
  './icons/favicon-32.png',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon.svg'
];

// 1. INSTALACIÓN: Precarga adaptativa según el scope actual (raíz o subcarpeta)
self.addEventListener('install', (event) => {
  const scope = self.registration.scope;
  const urlsToCache = ASSETS_RELATIVE.map(path => new URL(path, scope).href);

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precargando recursos para GitHub Pages bajo scope:', scope);
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.error('[SW] Error en precarga:', err);
      })
  );
});

// 2. ACTIVACIÓN: Limpieza de versiones obsoletas y control inmediato
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              console.log('[SW] Eliminando caché antigua:', name);
              return caches.delete(name);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// 3. FETCH: Cache-first estricto con navegación de respaldo garantizada
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const scope = self.registration.scope;
  const fallbackIndexUrl = new URL('./index.html', scope).href;

  // Interceptar navegación (modo offline / recarga de página en avión)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          return caches.match(fallbackIndexUrl);
        })
        .then((response) => {
          if (response) return response;
          return fetch(event.request).catch(() => caches.match(fallbackIndexUrl));
        })
    );
    return;
  }

  // Interceptar recursos estáticos (CSS, JS, iconos, manifest)
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true })
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Revalidación silenciosa en background si hay red
          fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
              }
            })
            .catch(() => {/* Offline silencioso */});
          return cachedResponse;
        }

        // Si no está en caché, buscar en red
        return fetch(event.request)
          .then((networkResponse) => {
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
            return networkResponse;
          })
          .catch(() => {
            if (event.request.destination === 'image') {
              return caches.match(new URL('./icons/icon.svg', scope).href);
            }
          });
      })
  );
});
