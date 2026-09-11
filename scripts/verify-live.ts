/** Explicit, bounded real-provider checks. Never run from pnpm verify or CI. */
import nextEnv from "@next/env";
import { mkdir, writeFile } from "node:fs/promises";
import { ktoSource } from "../src/infrastructure/kto/source.ts";
import { kakaoTravel } from "../src/infrastructure/kakao/travel.ts";
import { openRouterExtractor } from "../src/infrastructure/llm/extractor.ts";

nextEnv.loadEnvConfig(process.cwd(), false);
const mode = process.argv[2];
if (mode !== "probe")
  throw new Error("Usage: node scripts/verify-live.ts probe");
const names = [
  "KTO_SERVICE_KEY",
  "KAKAO_MOBILITY_REST_KEY",
  "OPENROUTER_API_KEY",
  "OPENROUTER_MODEL",
];
for (const name of names)
  if (!process.env[name]?.trim()) throw new Error(`Missing ${name}`);
if (process.env.LIVE_SERVICES_ENABLED !== "true")
  throw new Error("Live services are disabled");
const secrets = names
  .filter((n) => n !== "OPENROUTER_MODEL")
  .map((n) => process.env[n]!.trim());
function safe(value: string) {
  for (const secret of secrets)
    value = value
      .replaceAll(secret, "[redacted]")
      .replaceAll(encodeURIComponent(secret), "[redacted]");
  return value.replace(/https?:\/\/[^\s"<>]+/g, "[url]").slice(0, 600);
}
const calls: object[] = [];
let count = 0;
const measured: typeof fetch = async (input, init) => {
  if (++count > 20) throw new Error("Live probe request budget exceeded");
  const url = new URL(input instanceof Request ? input.url : input.toString());
  const started = Date.now();
  const response = await fetch(input, init);
  const data = await response
    .clone()
    .json()
    .catch(() => null);
  const entry = {
    operation: url.pathname,
    status: response.status,
    ms: Date.now() - started,
    resultCode: data?.response?.header?.resultCode,
    ...(data?.usage
      ? {
          usage: {
            prompt: data.usage.prompt_tokens,
            completion: data.usage.completion_tokens,
            cost: data.usage.cost,
          },
        }
      : {}),
    ...(!response.ok
      ? {
          error: safe(
            String(
              data?.error?.message || data?.msg || "Non-JSON upstream error",
            ),
          ),
        }
      : {}),
  };
  calls.push(entry);
  console.log(JSON.stringify(entry));
  return response;
};
const places = ktoSource(process.env.KTO_SERVICE_KEY!.trim(), measured);
const travel = kakaoTravel(
  process.env.KAKAO_MOBILITY_REST_KEY!.trim(),
  measured,
);
const extractor = openRouterExtractor(
  {
    apiKey: process.env.OPENROUTER_API_KEY!.trim(),
    model: process.env.OPENROUTER_MODEL!.trim(),
  },
  measured,
);
const results: Record<string, unknown> = {
  checkedAt: new Date().toISOString(),
  model: process.env.OPENROUTER_MODEL,
  calls,
};
try {
  const list = await places.search("인천");
  results.search = list;
  console.log(JSON.stringify({ places: list }));
  if (!list.length) throw new Error("No live search results");
  const sample = list.find((place) => place.id === "2848931") || list[0];
  const document = await places.get(sample.id);
  results.document = {
    place: document.place,
    characters: document.raw.length,
    fields: document.raw
      .split("\n")
      .filter((l) => /^[a-zA-Z]/.test(l))
      .map((l) => l.split(":")[0]),
    modifiedAt: document.modifiedAt,
  };
  console.log(JSON.stringify(results.document));
  if (list[1]) {
    const minutes = await travel.minutes(list[0], list[1]);
    results.routeMinutes = minutes;
    if (minutes === null) throw new Error("Live route unavailable");
  }
  // Only public tourism policy text is sent to the model; no pet profile or key.
  const policy = await extractor.extract(document);
  results.extraction = {
    rules: policy.rules.length,
    kinds: policy.rules.map((r) => r.kind),
    unresolved: policy.unresolved.length,
  };
  console.log(JSON.stringify(results.extraction));
  results.success = true;
} catch (error) {
  results.success = false;
  results.error = safe(
    error instanceof Error ? error.message : "Unknown failure",
  );
  console.log(JSON.stringify({ error: results.error }));
  process.exitCode = 1;
} finally {
  await mkdir(".cache/live", { recursive: true });
  await writeFile(
    `.cache/live/probe-${Date.now()}.json`,
    JSON.stringify(results, null, 2),
  );
  console.log(
    "Summary: .cache/live/probe-<timestamp>.json (no source text, extracted rules or credentials)",
  );
}
