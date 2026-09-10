import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppUrls } from "../../src/lib/urls/app-urls.ts";
import { parseBasePath } from "../../src/lib/urls/path.ts";
import { parseOrigin } from "../../src/lib/urls/origin.ts";

for (const base of ["", "/absproxy/3000", "/workspace/absproxy/3000"]) {
  test(`URLs preserve route, query and fragment with base '${base}'`, () => {
    const urls = createAppUrls(base);
    assert.equal(urls.apiPath("/api/health?check=1#result"), `${base}/api/health?check=1#result`);
    assert.equal(urls.publicAssetPath("/images/강아지.svg"), `${base}/images/강아지.svg`);
    assert.equal(urls.absoluteAppUrl("/about?from=home#purpose", "https://pawproof.example.com/"), `https://pawproof.example.com${base}/about?from=home#purpose`);
  });
}

test("base paths normalize only the root and trailing slash", () => {
  assert.equal(parseBasePath("/"), "");
  assert.equal(parseBasePath("/absproxy/3000/"), "/absproxy/3000");
});

for (const path of ["https://evil.test/file", "//evil.test/file", "/a//b", "/a/../b", "/a/./b", "/a/%2e%2e/b", "/a/%252e%252e/b", "/a/%2fb", "/a/%5cb", "/a/%00b", "/a/%ZZ", "/a\\b"]) {
  test(`rejects unsafe internal path: ${path}`, () => {
    assert.throws(() => createAppUrls("").absoluteAppUrl(path, "https://pawproof.example.com"));
  });
}

test("wrong helper and already-prefixed paths fail explicitly", () => {
  const urls = createAppUrls("/absproxy/3000");
  assert.throws(() => urls.absoluteAppUrl("/absproxy/3000/about", "https://example.com"));
  assert.throws(() => urls.apiPath("/about"));
  assert.throws(() => urls.apiPath("/apiculture"));
  assert.throws(() => urls.publicAssetPath("/api/health"));
  assert.throws(() => urls.publicAssetPath("/_next/static/main.js"));
  assert.throws(() => parseBasePath("/absproxy/3000?x=1"));
  assert.throws(() => parseBasePath("/absproxy/3000#hash"));
});

test("prefix matching respects segment boundaries", () => {
  assert.equal(createAppUrls("/app").absoluteAppUrl("/application", "https://example.com"), "https://example.com/app/application");
});

for (const origin of ["javascript:alert(1)", "https://user:secret@example.com", "https://example.com/about", "https://example.com/../", "https://example.com?x=1", "https://example.com#hash", " https://example.com", "https:\\example.com"]) {
  test("rejects unsafe or non-origin absolute URL input", () => assert.throws(() => parseOrigin(origin)));
}
