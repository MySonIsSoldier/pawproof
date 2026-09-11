import { test } from "node:test";
import assert from "node:assert/strict";
import { runInNewContext } from "node:vm";
import { readFileSync } from "node:fs";
import { pwaEnabled } from "../../src/config/pwa.ts";
import { createAppUrls } from "../../src/lib/urls/app-urls.ts";
import { workerSource } from "../../src/infrastructure/pwa/worker-source.ts";

test("offline font includes every Korean glyph in the fallback copy", () => {
  const source = readFileSync(
    new URL(
      "../../src/infrastructure/pwa/offline-document.ts",
      import.meta.url,
    ),
    "utf8",
  );
  const font = JSON.parse(
    readFileSync(
      new URL("../../src/assets/fonts/offline-font.json", import.meta.url),
      "utf8",
    ),
  );
  for (const character of source.match(/[가-힣]/gu) || []) {
    assert.ok(
      font.characters.includes(character),
      `Regenerate the offline font for ${character}`,
    );
  }
  assert.equal(
    Buffer.from(font.base64, "base64").subarray(0, 4).toString(),
    "wOF2",
  );
});

test("PWA defaults to production-only and browser-native URLs respect the proxy scope", () => {
  assert.equal(pwaEnabled(undefined, true), false);
  assert.equal(pwaEnabled(undefined, false), true);
  assert.equal(pwaEnabled("false", false), false);
  assert.equal(pwaEnabled("true", true), true);
  assert.throws(() => pwaEnabled("yes", true));
  const urls = createAppUrls("/absproxy/3000");
  assert.equal(urls.appPath("/"), "/absproxy/3000/");
  assert.equal(
    urls.appPath("/plan?mode=demo"),
    "/absproxy/3000/plan?mode=demo",
  );
  assert.throws(() => urls.appPath("/absproxy/3000/sw.js"));
});

test("worker never intercepts APIs, RSC, third-party requests or writes", () => {
  const listeners = new Map<string, (event: unknown) => void>();
  const scope = "https://example.test/absproxy/3000/";
  runInNewContext(workerSource("test"), {
    self: {
      registration: { scope },
      addEventListener: (name: string, handler: (event: unknown) => void) =>
        listeners.set(name, handler),
    },
    URL,
  });
  for (const [url, method, mode] of [
    [scope + "api/verify", "POST", "cors"],
    [scope + "api/places", "GET", "navigate"],
    [scope + "api?q=x", "GET", "navigate"],
    [scope + "plan?_rsc=abc", "GET", "cors"],
    [scope + "_next/static/a.js", "GET", "cors"],
    [scope + "auth/callback", "GET", "navigate"],
    ["https://third-party.test/", "GET", "navigate"],
    ["https://example.test/absproxy/3001/", "GET", "navigate"],
  ]) {
    let intercepted = false;
    listeners.get("fetch")!({
      request: { url, method, mode },
      respondWith: () => {
        intercepted = true;
      },
    });
    assert.equal(intercepted, false, `${method} ${url}`);
  }
});

test("login HTML cannot enter the offline cache when a proxy intercepts the public fallback", async () => {
  const listeners = new Map<string, (event: unknown) => void>();
  let cacheOpened = false;
  runInNewContext(workerSource("test"), {
    self: {
      registration: { scope: "https://example.test/" },
      addEventListener: (name: string, handler: (event: unknown) => void) =>
        listeners.set(name, handler),
    },
    URL,
    fetch: async (url: string) =>
      new Response(url.endsWith("offline") ? "<html>login</html>" : "png", {
        headers: {
          "content-type": url.endsWith("offline") ? "text/html" : "image/png",
        },
      }),
    caches: {
      open: () => {
        cacheOpened = true;
      },
    },
  });
  let installation: Promise<void> | undefined;
  listeners.get("install")!({
    waitUntil: (promise: Promise<void>) => {
      installation = promise;
    },
  });
  await assert.rejects(installation!, /Unexpected offline document/);
  assert.equal(cacheOpened, false);
});

test("disabling PWA unregisters only its exact scope and script", async () => {
  const { removeOwnWorker } =
    await import("../../src/features/pwa/remove-worker.ts");
  const scope = "https://ide.test/absproxy/3000/";
  const script = scope + "sw.js";
  let removed = 0;
  const deleted: string[] = [];
  const registration = {
    scope: "https://ide.test/",
    active: { scriptURL: "https://ide.test/code-server-worker.js" },
    waiting: null,
    installing: null,
    unregister: async () => {
      removed++;
      return true;
    },
  };
  const navigatorDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "navigator",
  );
  const cachesDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "caches",
  );
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: { serviceWorker: { getRegistration: async () => registration } },
  });
  Object.defineProperty(globalThis, "caches", {
    configurable: true,
    value: {
      keys: async () => [
        `pawproof-pwa:${scope}:old`,
        "pawproof-pwa:https://ide.test/absproxy/3001/:old",
        "other-app",
      ],
      delete: async (name: string) => {
        deleted.push(name);
        return true;
      },
    },
  });
  try {
    await removeOwnWorker(scope, script);
    assert.equal(removed, 0);
    registration.scope = scope;
    await removeOwnWorker(scope, script);
    assert.equal(removed, 0);
    registration.active.scriptURL = script;
    await removeOwnWorker(scope, script);
    assert.equal(removed, 1);
    assert.deepEqual(deleted, [`pawproof-pwa:${scope}:old`]);
  } finally {
    if (navigatorDescriptor)
      Object.defineProperty(globalThis, "navigator", navigatorDescriptor);
    else Reflect.deleteProperty(globalThis, "navigator");
    if (cachesDescriptor)
      Object.defineProperty(globalThis, "caches", cachesDescriptor);
    else Reflect.deleteProperty(globalThis, "caches");
  }
});
