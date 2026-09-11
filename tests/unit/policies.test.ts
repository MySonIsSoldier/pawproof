import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluatePolicy, summarize } from "../../src/domain/policies/evaluate.ts";
import { demoPolicy, createDemoTrip, demoProviders } from "../../src/infrastructure/demo/catalog.ts";
import { verifyTrip } from "../../src/application/use-cases/verify-trip.ts";
import { recoverTrip } from "../../src/application/use-cases/recover-trip.ts";
import { tripSchema } from "../../src/application/contracts/trip.ts";
import { validateExtraction } from "../../src/application/contracts/policy.ts";
import { weekday, formatTime } from "../../src/domain/itinerary/time.ts";
const context = { pets: [{ name: "두부", breed: "코기", weight: 10 }], zone: "indoor" as const, equipment: ["목줄"], date: "2026-09-12", arrival: 600, duration: 60 };
test("weight inclusive boundary and exclusive boundary differ", () => {
  const policy = demoPolicy("demo-table");
  assert.equal(summarize(evaluatePolicy(policy, context)), "available");
  policy.rules.find((r) => r.kind === "weight")!.operator = "lt";
  assert.equal(summarize(evaluatePolicy(policy, context)), "blocked");
});
test("individual pet restriction, count and all findings are retained", () => {
  const policy = demoPolicy("demo-table");
  policy.rules.find((r) => r.kind === "count")!.operator = "unknown";
  const findings = evaluatePolicy(policy, { ...context, pets: [...context.pets, { name: "콩", breed: "래브라도", weight: 20 }], equipment: [] });
  assert.equal(summarize(findings), "blocked");
  assert.ok(findings.some((f) => f.status === "confirm"));
  assert.ok(findings.some((f) => f.status === "prepare"));
});
test("missing count cannot be promoted to unrestricted", () => assert.equal(summarize(evaluatePolicy(demoPolicy("demo-lake"), context)), "confirm"));
test("AND and OR equipment rules differ", () => {
  const policy = demoPolicy("demo-cafe");
  const ready = { ...context, equipment: ["목줄", "유모차"] };
  assert.equal(summarize(evaluatePolicy(policy, ready)), "available");
  policy.rules.at(-1)!.operator = "all";
  assert.equal(summarize(evaluatePolicy(policy, ready)), "prepare");
});
test("indoor restriction does not leak to outdoor", () => {
  const policy = demoPolicy("demo-table"); policy.rules.find((r) => r.kind === "weight")!.scope = "indoor";
  const findings = evaluatePolicy(policy, { ...context, zone: "outdoor", pets: [{ ...context.pets[0], weight: 20 }] });
  assert.equal(summarize(findings), "confirm");
  assert.ok(!findings.some((f) => f.status === "blocked"));
});
test("stay through closing, unknown travel and Korean weekday", () => {
  assert.equal(summarize(evaluatePolicy(demoPolicy("demo-forest"), { ...context, arrival: 1130 })), "blocked");
  assert.equal(summarize(evaluatePolicy(demoPolicy("demo-forest"), { ...context, arrival: null })), "confirm");
  assert.equal(weekday("2026-09-13"), 0);
  assert.equal(formatTime(1500), "다음 날 01:00");
});
test("schema rejects invalid date, duplicate IDs and mixed data modes", () => {
  const trip = createDemoTrip();
  assert.equal(tripSchema.safeParse({ ...trip, date: "2026-02-30" }).success, false);
  assert.equal(tripSchema.safeParse({ ...trip, mode: "live" }).success, false);
  assert.equal(tripSchema.safeParse({ ...trip, visits: trip.visits.map(() => trip.visits[0]) }).success, false);
});
test("fabricated evidence and malformed semantic values rejected", () => {
  const policy = demoPolicy("demo-table");
  const value = { rules: policy.rules, unresolved: [] };
  assert.equal(validateExtraction(value, policy.raw).rules.length, 7);
  assert.throws(() => validateExtraction(value, "근거 없음"));
  assert.throws(() => validateExtraction({ ...value, rules: [{ ...policy.rules[1], operator: "any" }] }, policy.raw));
});
test("complete demo produces four states then safely repairs a restaurant", async () => {
  const trip = createDemoTrip();
  const result = await verifyTrip(trip, demoProviders());
  assert.deepEqual(result.visits.map((v) => v.status), ["available", "blocked", "prepare", "confirm"]);
  const { alternatives } = await recoverTrip(trip, 1, demoProviders());
  assert.ok(alternatives.length > 0);
  assert.equal(alternatives[0].place.category, "식당");
  assert.equal(alternatives[0].result.visits[1].status, "available");
  assert.equal(alternatives[0].result.visits[3].status, "confirm");
});
test("locked place cannot be replaced and subsequent appointment is preserved", async () => {
  const trip = createDemoTrip(); trip.visits[1].locked = true;
  await assert.rejects(recoverTrip(trip, 1, demoProviders()));
  trip.visits[1].locked = false; trip.visits[2].locked = true;
  const providers = demoProviders();
  providers.travel.minutes = async (a, b) => a.id === "demo-garden" || b.id === "demo-garden" || a.id === "demo-picnic" || b.id === "demo-picnic" ? 40 : 10;
  assert.equal((await recoverTrip(trip, 1, providers)).alternatives.length, 0);
});
test("extraction or travel failure never becomes an available result", async () => {
  const providers = demoProviders(); providers.extractor.extract = async () => { throw new Error("invalid response"); };
  providers.travel.minutes = async () => null;
  const result = await verifyTrip(createDemoTrip(), providers);
  assert.ok(result.visits.every((v) => v.status === "confirm"));
  assert.equal(result.visits[1].arrival, null); assert.equal(result.totalTravel, null);
});
