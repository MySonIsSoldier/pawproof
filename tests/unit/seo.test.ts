import assert from "node:assert/strict";
import test from "node:test";
import { resolveSiteOrigin } from "../../src/config/site.ts";

test("SEO defaults use the canonical www production origin", () => {
  assert.equal(resolveSiteOrigin({ APP_ORIGIN: "" }), "https://www.pawproof.kr");
  assert.equal(
    resolveSiteOrigin({ APP_ORIGIN: "https://www.pawproof.kr/" }),
    "https://www.pawproof.kr",
  );
});

test("SEO origin still accepts an explicit trusted deployment origin", () => {
  assert.equal(
    resolveSiteOrigin({ APP_ORIGIN: "https://pawproof-rose.vercel.app" }),
    "https://pawproof-rose.vercel.app",
  );
});
