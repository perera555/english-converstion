// SpeakUp service worker (v3): offline practice.
// - Pages: network first, cached copy when offline.
// - App files (/_next/static, icons) and the voice-recognizer library (jsDelivr): cache first.
// - Next.js data/prefetch requests (RSC) are never answered from cache (that sent clicks to home).
// - "precache" message: downloads chosen pages + their files for offline use, reporting progress.
const CACHE = "speakup-v3";
const LIB_HOSTS = ["cdn.jsdelivr.net"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(["/"])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("speakup-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const isRsc = (req, url) =>
  url.searchParams.has("_rsc") || req.headers.get("RSC") === "1" || req.headers.get("Next-Router-Prefetch") || req.headers.get("Next-Router-State-Tree");

const cacheFirst = (req) =>
  caches.match(req).then(
    (hit) =>
      hit ||
      fetch(req).then((res) => {
        if (res.ok || res.type === "opaque") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }),
  );

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Voice-recognizer library and engine files from the CDN: keep them for offline use.
  if (LIB_HOSTS.includes(url.hostname) && /@huggingface\/transformers|onnxruntime-web/.test(url.pathname)) {
    event.respondWith(cacheFirst(req));
    return;
  }
  if (url.origin !== self.location.origin || isRsc(req, url)) return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(cacheFirst(req));
    return;
  }

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(url.pathname, copy));
          }
          return res;
        })
        .catch(async () => (await caches.match(url.pathname)) || (await caches.match("/")) || Response.error()),
    );
  }
});

// Download pages (and the app files they use) for offline practice.
self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type !== "precache" || !Array.isArray(data.urls)) return;
  const port = event.ports && event.ports[0];
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const assets = new Set();
      let done = 0;
      let failed = 0;
      const queue = [...data.urls];
      const worker = async () => {
        while (queue.length) {
          const path = queue.shift();
          try {
            const res = await fetch(path, { credentials: "same-origin" });
            if (res.ok) {
              const html = await res.clone().text();
              await cache.put(path, res);
              for (const m of html.matchAll(/\/_next\/static\/[^"'\s)]+/g)) assets.add(m[0]);
            } else failed++;
          } catch {
            failed++;
          }
          done++;
          port && port.postMessage({ phase: "pages", done, total: data.urls.length, failed });
        }
      };
      await Promise.all([worker(), worker(), worker(), worker()]);
      const list = [...assets];
      let a = 0;
      for (const asset of list) {
        if (!(await cache.match(asset))) {
          try {
            const r = await fetch(asset);
            if (r.ok) await cache.put(asset, r);
          } catch {}
        }
        a++;
        if (a % 10 === 0 || a === list.length) port && port.postMessage({ phase: "files", done: a, total: list.length });
      }
      port && port.postMessage({ phase: "finished", failed });
    })(),
  );
});
