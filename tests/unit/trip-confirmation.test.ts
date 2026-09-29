import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyTripConfirmations,
  tripConfirmationSchema,
} from "../../src/application/contracts/trip-confirmation.ts";
import { createDemoTrip } from "../../src/fixtures/demo-trip.ts";
import { demoProviders } from "../../src/infrastructure/demo/catalog.ts";
import { verifyTrip } from "../../src/application/use-cases/verify-trip.ts";
import {
  createTripStore,
  tripRecord,
} from "../../src/features/itinerary/state/trip-store.ts";
import { initialTrip } from "../../src/features/itinerary/state/initial-trip.ts";
import { tripRecordSchema } from "../../src/application/contracts/trip-record.ts";

test("a venue answer changes only the matching finding in the current trip", async () => {
  const input = createDemoTrip("2026-09-14");
  const result = await verifyTrip(input, demoProviders());
  const lake = result.visits.find((visit) => visit.place.id === "demo-lake");
  const finding = lake?.findings.find((item) => item.status === "confirm");
  assert.ok(lake);
  assert.ok(finding);

  const confirmation = tripConfirmationSchema.parse({
    placeId: lake.place.id,
    kind: finding.kind,
    findingMessage: finding.message,
    outcome: "available",
    answer: "전화로 두 마리까지 가능하다고 안내받았어요.",
    inputFingerprint: JSON.stringify(input),
    recordedAt: "2026-09-14T01:00:00.000Z",
  });
  const applied = applyTripConfirmations(result, [confirmation], input);

  assert.equal(lake.status, "confirm");
  assert.equal(applied.visits.find((visit) => visit.place.id === lake.place.id)?.status, "available");
  assert.equal(result.visits.find((visit) => visit.place.id === lake.place.id)?.status, "confirm");
  assert.match(
    applied.visits.find((visit) => visit.place.id === lake.place.id)?.findings.find((item) => item.kind === finding.kind)?.message || "",
    /전화로 두 마리까지 가능/,
  );

  const changedInput = { ...input, startTime: "11:00" };
  const unchanged = applyTripConfirmations(result, [confirmation], changedInput);
  assert.equal(
    unchanged.visits.find((visit) => visit.place.id === lake.place.id)?.status,
    "confirm",
  );
});

test("recorded answers survive the account note contract and restore", async () => {
  const input = createDemoTrip("2026-09-14");
  const result = await verifyTrip(input, demoProviders());
  const store = createTripStore(input);
  store.getState().acceptVerification(0, result);
  const lake = result.visits.find((visit) => visit.place.id === "demo-lake");
  const finding = lake?.findings.find((item) => item.status === "confirm");
  assert.ok(lake);
  assert.ok(finding);
  store.getState().recordConfirmation({
    placeId: lake.place.id,
    kind: finding.kind,
    findingMessage: finding.message,
    outcome: "available",
    answer: "현장에 확인했고 입장 가능하다고 답변받았어요.",
  });

  const saved = tripRecordSchema.parse(tripRecord(store.getState()));
  assert.equal(saved.confirmations.length, 1);
  assert.equal(
    saved.verification?.result.visits.find((visit) => visit.place.id === "demo-lake")?.status,
    "available",
  );
  const restored = createTripStore(initialTrip("live", input.date));
  restored.getState().restore(saved);
  assert.equal(
    restored.getState().verification?.result.visits.find((visit) => visit.place.id === "demo-lake")?.status,
    "available",
  );
  assert.equal(restored.getState().confirmations[0].answer, "현장에 확인했고 입장 가능하다고 답변받았어요.");
});
