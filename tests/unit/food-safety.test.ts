import { test } from "node:test";
import assert from "node:assert/strict";
import { inspectInputSchema } from "../../src/application/contracts/discovery.ts";
import { addMfdsFacts } from "../../src/domain/policies/mfds-facts.ts";
import { foodSafetySource } from "../../src/infrastructure/food-safety/source.ts";
import { demoPolicy } from "../../src/infrastructure/demo/catalog.ts";
import { verifyTrip } from "../../src/application/use-cases/verify-trip.ts";

test("Food Safety Korea snapshot exposes geocoded official places", async () => {
  const source = foodSafetySource();
  const places = await source.around!({ lat: 37.5636, lng: 126.9856 }, 20_000);
  assert.ok(places.length > 0);
  assert.ok(places.every((place) => place.source === "mfds"));
  assert.ok(places.every((place) => place.id.startsWith("mfds-")));
  const document = await source.get(places[0]!.id);
  assert.match(document.raw, /식품안전나라 반려동물 동반출입 음식점 목록/);
  assert.equal(document.supplementalSources?.length, 1);
});

test("Food Safety Korea places keep entry confirmation while preserving unknown details", () => {
  const raw = [
    "식품안전나라 반려동물 동반출입 음식점 목록에 등재된 업소예요.",
    "세부 조건(실내·테라스·체중·마릿수·견종·예약)은 방문 전 업소에 확인해 주세요.",
  ].join("\n");
  const policy = addMfdsFacts({
    ...demoPolicy("demo-table"),
    raw,
    rules: [],
    unresolved: [],
  });
  assert.ok(policy.rules.some((rule) => rule.kind === "entry"));
  assert.ok(policy.unresolved.some((message) => message.includes("식약처 목록")));
});

test("inspection accepts official Food Safety Korea ids", () => {
  assert.equal(inspectInputSchema.safeParse({ ids: ["mfds-1"] }).success, true);
});

test("verified courses retain the official entry fact for an MFDS place", async () => {
  const places = foodSafetySource();
  const place = (await places.around!({ lat: 37.5636, lng: 126.9856 }, 20_000))[0]!;
  const result = await verifyTrip(
    {
      mode: "live",
      pets: [{ name: "두부", breed: "푸들", weight: 5 }],
      date: "2026-09-20",
      startTime: "10:00",
      equipment: [],
      visits: [{ placeId: place.id, duration: 60, zone: "outdoor", locked: false }],
    },
    {
      places,
      extractor: { extract: async () => demoPolicy("demo-table") },
      travel: { basis: "unavailable", minutes: async () => null },
    },
  );
  assert.ok(result.visits[0]!.findings.some((finding) => finding.kind === "entry"));
  assert.ok(result.visits[0]!.policy.sources?.some((source) => source.label.includes("식품안전나라")));
});
