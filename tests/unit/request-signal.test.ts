import { test } from "node:test";
import assert from "node:assert/strict";
import { getEventListeners } from "node:events";
import { withRequestSignal } from "../../src/lib/http/request-signal.ts";

test("request signals work without static AbortSignal methods and clean up on success", async (t) => {
  const unsupported = () => {
    throw new TypeError("AbortSignal static methods are unavailable");
  };
  t.mock.method(AbortSignal, "any", unsupported);
  t.mock.method(AbortSignal, "timeout", unsupported);
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const source = new AbortController();
  let received!: AbortSignal;
  assert.equal(
    await withRequestSignal(100, source.signal, async (signal) => {
      received = signal;
      return "parsed body";
    }),
    "parsed body",
  );
  assert.equal(getEventListeners(source.signal, "abort").length, 0);
  source.abort();
  t.mock.timers.tick(100);
  assert.equal(received.aborted, false);
});

test("source cancellation reaches a pending request with its original reason", async () => {
  const source = new AbortController();
  const reason = new DOMException("Cancelled", "AbortError");
  await withRequestSignal(100, source.signal, async (signal) => {
    source.abort(reason);
    assert.equal(signal.aborted, true);
    assert.equal(signal.reason, reason);
  });
  assert.equal(getEventListeners(source.signal, "abort").length, 0);
});

test("a previously cancelled source is passed through immediately", async () => {
  const source = new AbortController();
  source.abort();
  await withRequestSignal(100, source.signal, async (signal) => {
    assert.equal(signal.aborted, true);
    assert.equal(signal.reason, source.signal.reason);
  });
});

test("timeout stays active while a response body is pending", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const result = withRequestSignal(100, undefined, async (signal) => {
    // Fetch has returned headers, but consuming its body is still pending.
    await Promise.resolve();
    return new Promise((_, reject) => {
      signal.addEventListener("abort", () => reject(signal.reason), {
        once: true,
      });
    });
  });
  const rejected = assert.rejects(result, { name: "TimeoutError" });
  await Promise.resolve();
  t.mock.timers.tick(100);
  await rejected;
});

test("failed requests release their timer and source listener", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const source = new AbortController();
  let received!: AbortSignal;
  await assert.rejects(
    withRequestSignal(100, source.signal, async (signal) => {
      received = signal;
      throw new Error("Invalid response");
    }),
    /Invalid response/,
  );
  assert.equal(getEventListeners(source.signal, "abort").length, 0);
  t.mock.timers.tick(100);
  assert.equal(received.aborted, false);
});
