// service-worker.js
// =====================
// Progressive Web App service worker for offline support
// Caches static assets and the GeoJSON file
// =====================

// Change this version when updating files to force cache refresh
const CACHE = "ireland-map-v1";

// Files and URLs to cache
const ASSETS = [
  "./",                       // root
  "./index.html",              // main page
  "./manifest.json",           // PWA manifest
  "./irish_counties.geojson",  // map data
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css", // Leaflet CSS
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"   // Leaflet JS
];

// Install event — pre-cache all required assets
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing and caching app shell...");
  event.waitUntil(
    caches.open(CACHE).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Activate event — clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating new version and cleaning old caches...");
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE)
          .map((key) => caches.delete(key))
      );
    })
  );
});

// Fetch event — serve cached assets when offline
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached file, or fetch from network if not available
      return (
        cachedResponse ||
        fetch(event.request).then((networkResponse) => {
          // Optionally cache new requests
          return caches.open(CACHE).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
      );
    }).catch(() => {
      // Optional fallback: handle offline errors gracefully
      if (event.request.destination === "document") {
        return caches.match("./index.html");
      }
    })
  );
});
