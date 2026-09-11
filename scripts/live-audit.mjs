/** Opt-in metadata-only observer for a local live verification server. */
import { appendFileSync, mkdirSync, readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

if (process.env.PAWPROOF_LIVE_AUDIT === "true") {
  const file = new URL(
    "../.cache/live/browser-provider-events.jsonl",
    import.meta.url,
  );
  mkdirSync(new URL(".", file), { recursive: true });
  const providers = new Map([
    ["apis.data.go.kr", { name: "kto", limit: 100 }],
    ["openrouter.ai", { name: "openrouter", limit: 20 }],
    ["apis-navi.kakaomobility.com", { name: "kakao", limit: 40 }],
  ]);
  const original = globalThis.fetch;
  const record = (entry) =>
    appendFileSync(file, JSON.stringify(entry) + "\n", { mode: 0o600 });
  globalThis.fetch = async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    const provider = providers.get(url.hostname);
    if (!provider) return original(input, init);
    let previous = [];
    try {
      previous = readFileSync(file, "utf8")
        .trim()
        .split("\n")
        .filter(Boolean)
        .map(JSON.parse);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    if (
      previous.filter(
        (e) => e.event === "start" && e.provider === provider.name,
      ).length >= provider.limit
    )
      throw new Error("Live audit provider request limit reached");
    const id = randomUUID();
    const started = Date.now();
    record({
      event: "start",
      id,
      provider: provider.name,
      operation: url.pathname,
      at: new Date().toISOString(),
    });
    try {
      const response = await original(input, init);
      const data = await response
        .clone()
        .json()
        .catch(() => null);
      const usage = data?.usage;
      record({
        event: "finish",
        id,
        status: response.status,
        ms: Date.now() - started,
        ...(provider.name === "kto"
          ? { resultCode: data?.response?.header?.resultCode }
          : {}),
        ...(provider.name === "openrouter" && usage
          ? {
              promptTokens: usage.prompt_tokens,
              completionTokens: usage.completion_tokens,
              cost: usage.cost,
            }
          : {}),
      });
      return response;
    } catch (error) {
      record({ event: "finish", id, status: null, ms: Date.now() - started });
      throw error;
    }
  };
}
