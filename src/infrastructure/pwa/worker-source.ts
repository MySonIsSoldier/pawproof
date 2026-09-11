/** Small allowlist-only worker: no application HTML, RSC, API or user data cache. */
export function workerSource(release: string): string {
  return (
    `const RELEASE = ${JSON.stringify(release)};\n` +
    String.raw`
const SCOPE = self.registration.scope;
const PREFIX = "pawproof-pwa:" + SCOPE + ":";
const CACHE = PREFIX + RELEASE;
const OFFLINE = new URL("offline", SCOPE).href;
const ICONS = ["icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png"]
  .map(name => new URL("pwa/" + name, SCOPE).href);
const ASSETS = [OFFLINE, ...ICONS];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const responses = await Promise.all(ASSETS.map(async url => {
      const response = await fetch(url, { cache: "reload" });
      const type = response.headers.get("content-type") || "";
      if (!response.ok || response.redirected || !type.includes(url === OFFLINE ? "text/html" : "image/png"))
        throw new Error("Offline assets unavailable");
      if (url === OFFLINE && !(await response.clone().text()).includes('data-pawproof-offline="true"'))
        throw new Error("Unexpected offline document");
      return response;
    }));
    const cache = await caches.open(CACHE);
    await Promise.all(ASSETS.map((url, index) => cache.put(url, responses[index])));
    // Updates wait until explicitly requested; never reload an edited trip silently.
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(PREFIX) && name !== CACHE).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING" && event.source?.url?.startsWith(SCOPE))
    event.waitUntil(self.skipWaiting());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || !url.href.startsWith(SCOPE)) return;
  const relativePath = url.href.slice(SCOPE.length);
  // Explicit exclusions also cover browser navigation to these endpoints.
  if (/^(api|_next|auth|__)(\/|$|\?)/.test(relativePath)) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(async () => {
      const cache = await caches.open(CACHE);
      return await cache.match(OFFLINE) || Response.error();
    }));
  } else if (ICONS.includes(url.href)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      return await cache.match(request) || fetch(request);
    })());
  }
});
`
  );
}
