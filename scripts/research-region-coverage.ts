/** Explicit, bounded KTO research; persist counts/IDs only, never policy text or credentials. */
import nextEnv from "@next/env";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { z } from "zod";
import { parseKtoItems } from "../src/infrastructure/kto/source.ts";

nextEnv.loadEnvConfig(process.cwd(), false);
if (process.argv[2] !== "--live")
  throw new Error("Use --live for the bounded research run");
const key = process.env.KTO_SERVICE_KEY?.trim();
if (!key || process.env.LIVE_SERVICES_ENABLED !== "true")
  throw new Error("Live KTO configuration required");
let calls = 0;
async function request(operation: string, params: Record<string, string>) {
  if (++calls > 100) throw new Error("Research budget exhausted");
  const url = new URL(
    `https://apis.data.go.kr/B551011/KorPetTourService2/${operation}`,
  );
  url.search = new URLSearchParams({
    serviceKey: key!,
    MobileOS: "ETC",
    MobileApp: "PawProof",
    _type: "json",
    numOfRows: "100",
    pageNo: "1",
    ...params,
  }).toString();
  const response = await fetch(url, {
    signal: AbortSignal.timeout(20000),
  }).catch(() => {
    throw new Error("KTO research request failed (URL omitted)");
  });
  if (!response.ok) throw new Error(`KTO HTTP ${response.status}`);
  const json = await response.json();
  return {
    items: parseKtoItems(json),
    total: z.coerce
      .number()
      .int()
      .nonnegative()
      .parse(json.response.body.totalCount),
  };
}
const results: object[] = [];
for (const [name, code] of [
  ["경기", "41"],
  ["강원", "51"],
  ["인천", "28"],
  ["충남", "44"],
  ["제주", "50"],
]) {
  const counts: Record<string, number> = {};
  const items = [];
  for (const type of ["12", "14", "28", "39"]) {
    const result = await request("areaBasedList2", {
      lDongRegnCd: code,
      contentTypeId: type,
      arrange: "A",
    });
    counts[type] = result.total;
    items.push(...result.items);
  }
  const food = items.filter((p) => String(p.contenttypeid) === "39");
  const sample = [];
  for (const place of food.slice(0, 6)) {
    const { items: policies } = await request("detailPetTour2", {
      contentId: String(place.contentid),
    });
    const policy = policies[0] ?? {};
    const raw = Object.values(policy).join(" ");
    sample.push({
      id: place.contentid,
      name: place.title,
      address: place.addr1,
      hasAnimal: !!policy.acmpyPsblCpam,
      hasRequirements: !!policy.acmpyNeedMtr,
      weightSignal: /kg|㎏|킬로|체중/i.test(raw),
      countSignal: /마리|마릿수/.test(raw),
      carrierSignal: /이동장|케이지|유모차/.test(raw),
    });
  }
  const districts: Record<string, number> = {};
  for (const p of items) {
    const district = String(p.addr1).split(" ")[1] || "unknown";
    districts[district] = (districts[district] || 0) + 1;
  }
  const result = {
    name,
    code,
    counts,
    retrieved: items.length,
    districts,
    sample,
    foodPlaces: food.map((p) => ({
      id: p.contentid,
      name: p.title,
      address: p.addr1,
    })),
  };
  results.push(result);
  console.log(JSON.stringify(result));
}
// Optional offline aggregation of an official page already downloaded for review.
// Do not persist or republish its business-level table in the product.
const registryPath = process.argv[3];
let officialCounts: Record<string, number> | undefined;
if (registryPath) {
  const html = await readFile(registryPath, "utf8");
  const embedded = html.match(
    /<script[^>]*id="resultListData"[^>]*>([\s\S]*?)<\/script>/,
  )?.[1];
  if (!embedded) throw new Error("Official registry format changed");
  const records = z
    .array(z.object({ lgaldngNm: z.string(), siteAddr: z.string() }))
    .parse(JSON.parse(embedded));
  officialCounts = { total: records.length };
  for (const record of records) {
    const district = record.siteAddr.trim().split(/\s+/)[1];
    for (const scope of [record.lgaldngNm, `${record.lgaldngNm} ${district}`])
      officialCounts[scope] = (officialCounts[scope] ?? 0) + 1;
  }
}
await mkdir(".cache/regions", { recursive: true });
await writeFile(
  ".cache/regions/coverage.json",
  JSON.stringify(
    {
      checkedAt: new Date().toISOString(),
      calls,
      method:
        "First 100 rows/type; first six food venues by provider title order. Keyword signals are not validated rules.",
      results,
      officialCounts,
    },
    null,
    2,
  ),
);
