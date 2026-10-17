/*
 * AutoPart service worker.
 *
 * - Hashed build assets, part illustrations and icons: cache-first.
 * - Product images: stale-while-revalidate.
 * - Page navigations: network-first. Public and visitor pages are kept in the
 *   "autopart-pages" cache so a visitor who loses signal can still read pages
 *   they opened recently; admin and warehouse pages are never stored.
 *   The cache is cleared on sign-out (see user-menu.tsx).
 * - Never touched: API calls, Server Actions / any non-GET request, RSC
 *   payload fetches, other origins. Orders are never queued offline — stock
 *   must be confirmed by the server at submission time.
 */
const VERSION = "v1";
const STATIC_CACHE = `autopart-static-${VERSION}`;
const IMAGE_CACHE = `autopart-images-${VERSION}`;
const PAGE_CACHE = `autopart-pages-${VERSION}`;
const OFFLINE_URL = "/offline";
const PRECACHE = [OFFLINE_URL, "/icons/icon-192.png", "/icons/icon-512.png", "/icon.svg", "/manifest.webmanifest"];
const MAX_PAGES = 40;
const MAX_IMAGES = 150;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  const keep = new Set([STATIC_CACHE, IMAGE_CACHE, PAGE_CACHE]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("autopart-") && !keep.has(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

function cacheablePage(url) {
  const p = url.pathname;
  if (p.startsWith("/admin") || p.startsWith("/warehouse") || p.startsWith("/login") || p.startsWith("/api")) return false;
  return true;
}

async function networkFirstPage(request) {
  const url = new URL(request.url);
  try {
    const response = await fetch(request);
    // Only store real pages: successful, not redirected (e.g. to /login), HTML.
    if (response.ok && !response.redirected && cacheablePage(url) && (response.headers.get("content-type") || "").includes("text/html")) {
      const cache = await caches.open(PAGE_CACHE);
      await cache.put(request, response.clone());
      trim(PAGE_CACHE, MAX_PAGES);
    }
    return response;
  } catch {
    const cached = await caches.match(request, { ignoreVary: true });
    if (cached) return cached;
    return (await caches.match(OFFLINE_URL)) || new Response("Offline", { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } });
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(cacheName);
    await cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone()).then(() => trim(IMAGE_CACHE, MAX_IMAGES));
      }
      return response;
    })
    .catch(() => cached);
  return cached || network;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // React Server Component payloads for client-side navigation: always network.
  if (request.headers.get("RSC") || url.searchParams.has("_rsc")) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request));
    return;
  }
  if (url.pathname.startsWith("/api/images/")) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }
  if (url.pathname.startsWith("/api/")) return;
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/parts/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  }
});
