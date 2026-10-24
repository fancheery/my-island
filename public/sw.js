const VERSION = "v0.1.0";
const SHELL = [
  "/",
  "/archive",
  "/chat",
  "/settings",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(`island-shell-${VERSION}`)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !k.startsWith("island-shell-") && !k.startsWith("island-img-"))
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // 静态资源：缓存优先
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(`island-shell-${VERSION}`).then((c) => c.put(request, copy));
            return res;
          })
      )
    );
    return;
  }

  // 日记列表：离线也能看海岸线
  if (url.pathname === "/api/entries" || url.pathname === "/api/auth/me") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(`island-shell-${VERSION}`).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // 图片
  if (url.pathname === "/api/image") {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(`island-img-${VERSION}`).then((c) => c.put(request, copy));
            }
            return res;
          })
      )
    );
    return;
  }

  // 页面导航：网络优先，离线回退到缓存首页
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/"))
    );
  }
});
