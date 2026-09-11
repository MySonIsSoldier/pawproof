/** Opt-in real API audit. Saves coverage metadata, never KTO text or extracted rules. */
import nextEnv from "@next/env";
import { mkdir, writeFile } from "node:fs/promises";
import { ktoSource } from "../src/infrastructure/kto/source.ts";
import { openRouterExtractor } from "../src/infrastructure/llm/extractor.ts";
import { incheonSupplements } from "../src/infrastructure/incheon/supplements.ts";
import { enrichedExtractor } from "../src/application/use-cases/enrich-policy.ts";
import { evaluatePolicy, summarize } from "../src/domain/policies/evaluate.ts";
import type { Policy } from "../src/domain/policies/types.ts";
nextEnv.loadEnvConfig(process.cwd(), false);
if (process.argv[2] !== "--live")
  throw new Error(
    "Explicit opt-in required: node scripts/audit-incheon.ts --live",
  );
for (const name of [
  "KTO_SERVICE_KEY",
  "OPENROUTER_API_KEY",
  "OPENROUTER_MODEL",
])
  if (!process.env[name]?.trim()) throw new Error(`Missing ${name}`);
if (process.env.LIVE_SERVICES_ENABLED !== "true")
  throw new Error("Live services disabled");
const calls = { kto: 0, openrouter: 0 };
let cost = 0;
const measured: typeof fetch = async (input, init) => {
  const host = new URL(input instanceof Request ? input.url : String(input))
    .hostname;
  const provider =
    host === "apis.data.go.kr"
      ? "kto"
      : host === "openrouter.ai"
        ? "openrouter"
        : null;
  if (!provider) throw new Error("Unexpected audit provider");
  calls[provider]++;
  if (calls[provider] > (provider === "kto" ? 110 : 42))
    throw new Error("Audit request budget exceeded");
  const response = await fetch(input, init);
  if (provider === "openrouter") {
    const j = await response
      .clone()
      .json()
      .catch(() => null);
    if (typeof j?.usage?.cost === "number") cost += j.usage.cost;
  }
  return response;
};
const places = ktoSource(process.env.KTO_SERVICE_KEY!.trim(), measured);
const extractor = openRouterExtractor(
  {
    apiKey: process.env.OPENROUTER_API_KEY!.trim(),
    model: process.env.OPENROUTER_MODEL!.trim(),
  },
  measured,
);
const supplements = incheonSupplements();
const checkedAt = new Date().toISOString();
const results: object[] = [];
try {
  const inventory = await places.search("인천");
  const linked = inventory.filter((p) => supplements.find(p).documents.length);
  const requestedIds = process.argv
    .find((arg) => arg.startsWith("--ids="))
    ?.slice(6)
    .split(",");
  const selected = (
    requestedIds
      ? inventory.filter((p) => requestedIds.includes(p.id))
      : [...linked, ...inventory.filter((p) => !linked.includes(p))]
  ).slice(0, 30);
  const context = {
    pets: [{ name: "검증견", breed: "골든리트리버", weight: 12 }],
    zone: "outdoor" as const,
    equipment: ["목줄", "배변봉투"],
    date: "2026-09-12",
    arrival: 780,
    duration: 30,
  };
  const stats = (policy: Policy) => {
    const findings = evaluatePolicy(policy, context);
    return {
      status: summarize(findings),
      kinds: [...new Set(policy.rules.map((r) => r.kind))],
      missing: [
        ...new Set(
          findings
            .filter((f) => f.quote === null && f.kind !== "source")
            .map((f) => f.kind),
        ),
      ],
      unresolved: policy.unresolved.length,
      conflicts: new Set(
        policy.rules
          .filter((r) => r.conflict)
          .map((r) => `${r.kind}:${r.scope}`),
      ).size,
      notices: policy.notices?.length || 0,
    };
  };
  for (const place of selected) {
    try {
      const document = await places.get(place.id);
      let baseline: Policy;
      try {
        baseline = await extractor.extract(document);
      } catch {
        results.push({ place, error: "Primary extraction failed" });
        continue;
      }
      const enriched = await enrichedExtractor(
        {
          extract: (doc) =>
            doc === document
              ? Promise.resolve(baseline)
              : extractor.extract(doc),
        },
        supplements,
      ).extract(document);
      const result = {
        place,
        baseline: stats(baseline),
        enriched: stats(enriched),
        sources: enriched.sources?.map((s) => ({
          label: s.label,
          publishedAt: s.publishedAt,
          phone: s.phone,
        })),
        characters: document.raw.length,
      };
      results.push(result);
      console.log(
        JSON.stringify({
          completed: results.length,
          id: place.id,
          baseline: result.baseline.status,
          enriched: result.enriched.status,
          missingBefore: result.baseline.missing.length,
          missingAfter: result.enriched.missing.length,
        }),
      );
    } catch {
      results.push({ place, error: "Place audit failed" });
    }
  }
  await mkdir(".cache/incheon", { recursive: true });
  const path = `.cache/incheon/audit-${Date.now()}.json`;
  await writeFile(
    path,
    JSON.stringify(
      {
        checkedAt,
        inventoryCount: inventory.length,
        linkedCount: linked.length,
        sampleSize: selected.length,
        calls,
        reportedCost: cost,
        results,
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify({ report: path, calls, reportedCost: cost }));
  if (results.some((r) => "error" in r)) process.exitCode = 1;
} catch {
  console.error("Audit failed; credentials and upstream payloads omitted.");
  process.exitCode = 1;
}
