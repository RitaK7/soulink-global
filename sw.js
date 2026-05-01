const CACHE_NAME = "soulink-v2026-05-01-data-sync-1";

const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png"
];

const NETWORK_FIRST_DESTINATIONS = new Set([
  "document",
  "script",
  "style",
  "manifest"
]);

function sameOrigin(request) {
  try {
    return new URL(request.url).origin === self.location.origin;
  } catch (err) {
    return false;
  }
}

function shouldUseNetworkFirst(request) {
  const url = new URL(request.url);

  if (request.mode === "navigate") return true;
  if (NETWORK_FIRST_DESTINATIONS.has(request.destination)) return true;

  return (
    url.pathname.endsWith(".html") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".json")
  );
}

async function fetchFresh(request) {
  try {
    return await fetch(new Request(request, { cache: "reload" }));
  } catch (err) {
    return await fetch(request);
  }
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetchFresh(request);

    if (response && response.ok) {
      cache.put(request, response.clone());
    }

    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;

    if (request.mode === "navigate") {
      return (await cache.match("/index.html")) || Response.error();
    }

    return Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) return cached;

  const response = await fetch(request);

  if (response && response.ok) {
    cache.put(request, response.clone());
  }

  return response;
}

async function clearRuntimeCaches() {
  const keys = await caches.keys();

  await Promise.all(
    keys
      .filter((key) => key.startsWith("soulink-"))
      .map((key) => caches.delete(key))
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      ),
      self.clients.claim()
    ])
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SOULINK_CLEAR_RUNTIME_CACHE") {
    event.waitUntil(clearRuntimeCaches());
  }

  if (event.data && event.data.type === "SOULINK_SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;
  if (!sameOrigin(request)) return;

  if (shouldUseNetworkFirst(request)) {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(cacheFirst(request));
});
