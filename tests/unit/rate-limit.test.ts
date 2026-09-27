import assert from "node:assert/strict";
import test from "node:test";
import {
  consumeRateLimit,
  rateLimitKey,
} from "../../src/server/rate-limit.ts";

test("rate limit allows a bounded burst and reports retry time", () => {
  const policy = { limit: 2, windowMs: 10_000 };
  assert.deepEqual(consumeRateLimit("test-burst", policy, 1_000), {
    allowed: true,
    remaining: 1,
    retryAfterSeconds: 0,
  });
  assert.deepEqual(consumeRateLimit("test-burst", policy, 2_000), {
    allowed: true,
    remaining: 0,
    retryAfterSeconds: 0,
  });
  assert.deepEqual(consumeRateLimit("test-burst", policy, 3_000), {
    allowed: false,
    remaining: 0,
    retryAfterSeconds: 8,
  });
  assert.equal(consumeRateLimit("test-burst", policy, 11_000).allowed, true);
});

test("rate limit key scopes callers by route and forwarded IP", () => {
  const request = new Request("https://pawproof.kr/api/verify", {
    headers: { "x-forwarded-for": "198.51.100.10, 10.0.0.1" },
  });
  assert.equal(rateLimitKey(request, "verify"), "verify:198.51.100.10");
});
