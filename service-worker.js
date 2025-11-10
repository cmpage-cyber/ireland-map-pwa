// service-worker.js
// ======================================================
// Progressive Web App (PWA) Service Worker
// for the Ireland Interactive County Map
// ======================================================

// 🔄 Bump this version any time you change a file
const CACHE = "ireland-map-v4";

// List of core assets to cache (update if files change)
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./irish_counties.geojson",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
];

// ======================================================
// INSTALL EVENT
// Pre-caches app shell and data
// ======================================================
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing and caching core assets…");
  self.skipWaiting(); // take control immediately

  event.waitUntil(
    caches.open(CACHE).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// ======================================================
// ACTIVATE EVENT
// Cleans old caches and claims new clients
// ======================================================
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating new version:", CACHE);

  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE)
          .map((key) => {
            console.log("[Service Worker] Removing old cache:", key);
            return caches.delete(key);
          })
      );
    })
  );

  // Take control of open pages immediately
  self.clients.claim();
});

// ======================================================
// FETCH EVENT
// Serves cached assets first, then falls back to network
// ======================================================
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Ignore non-GET requests and external analytics requests
  if (req.method !== "GET" || req.url.includes("google-analytics")) {
    return;
  }

  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      // Serve cached version if found
      if (cachedResponse) {
        return cachedResponse;
      }

      // Otherwise fetch from network and cache dynamically
      return fetch(req)
        .then((networkResponse) => {
          // Only cache valid responses
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
            return networkResponse;
          }

          const responseClone = networkResponse.clone();
          caches.open(CACHE).then((cache) => cache.put(req, responseClone));
          return networkResponse;
        })
        .catch(() => {
          // Optional fallback: serve offline content if network fails
          if (req.destination === "document") {
            return caches.match("./index.html");
          }
        });
    })
  );
});

// ======================================================
// MESSAGE EVENT (optional)
// Allows manual cache clearing from the web app
// ======================================================
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CLEAR_CACHE") {
    caches.keys().then((keys) => {
      keys.forEach((key) => {
        console.log("[Service Worker] Manually clearing cache:", key);
        caches.delete(key);
      });
    });
  }
});
