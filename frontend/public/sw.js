const CACHE_NAME = "running-coach-v2"; // bumped — forces old (stale) caches to be purged
const APP_SHELL = ["/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // API calls: try network, fall back to cache if offline
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // The HTML shell (navigations, and "/" or "/index.html" directly):
  // ALWAYS try the network first, so a new deploy is picked up immediately.
  // Only fall back to a cached copy if you're offline.
  const isHtmlRequest =
    event.request.mode === "navigate" ||
    url.pathname === "/" ||
    url.pathname === "/index.html";

  if (isHtmlRequest) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Hashed static assets (JS/CSS from /assets/, etc.) are safe to cache-first —
  // their filename changes whenever the content changes, so stale content isn't a risk.
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
