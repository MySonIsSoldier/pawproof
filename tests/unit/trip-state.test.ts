import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createTripStore,
  isTripStale,
} from "../../src/features/itinerary/state/trip-store.ts";
import { createDemoTrip } from "../../src/fixtures/demo-trip.ts";
import { demoProviders } from "../../src/infrastructure/demo/catalog.ts";
import { verifyTrip } from "../../src/application/use-cases/verify-trip.ts";
import { recoverTrip } from "../../src/application/use-cases/recover-trip.ts";
import { initialTrip } from "../../src/features/itinerary/state/initial-trip.ts";

import { koreaToday } from "../../src/domain/itinerary/time.ts";

const trip = () => createDemoTrip("2026-09-14");

test("planner stores are isolated and late results cannot overwrite edited inputs", async () => {
  const first = createTripStore(trip());
  const second = createTripStore(trip());
  const result = await verifyTrip(trip(), demoProviders());
  first.getState().update({ ...first.getState().trip, startTime: "11:07" });
  assert.equal(first.getState().acceptVerification(0, result), false);
  assert.equal(first.getState().verification, null);
  assert.equal(second.getState().trip.startTime, "10:00");
  assert.equal(second.getState().revision, 0);
});

test("editing marks accepted verification stale and mode reset removes server snapshots", async () => {
  const store = createTripStore(trip());
  store
    .getState()
    .acceptVerification(0, await verifyTrip(trip(), demoProviders()));
  assert.equal(isTripStale(store.getState()), false);
  store.getState().update({ ...store.getState().trip, startTime: "11:00" });
  assert.equal(isTripStale(store.getState()), true);
  store.getState().reset(initialTrip("live", "2026-09-15"), "new");
  assert.equal(store.getState().verification, null);
  assert.deepEqual(store.getState().places, {});
});

test("alternative and undo restore the corresponding input/result atomically", async () => {
  const store = createTripStore(trip());
  const result = await verifyTrip(trip(), demoProviders());
  store.getState().acceptVerification(0, result);
  const { alternatives } = await recoverTrip(trip(), 1, demoProviders());
  assert.ok(alternatives.length);
  store.getState().applyAlternative(0, 1, alternatives[0]);
  assert.equal(
    store.getState().trip.visits[1].placeId,
    alternatives[0].place.id,
  );
  assert.equal(isTripStale(store.getState()), false);
  store.getState().undo();
  assert.deepEqual(store.getState().trip, trip());
  assert.equal(store.getState().verification?.result, result);
  assert.equal(isTripStale(store.getState()), false);
  store.getState().applyAlternative(0, 1, alternatives[0]);
  assert.deepEqual(
    store.getState().trip,
    trip(),
    "old candidate revision must be rejected",
  );
});

test("new edits invalidate undo so it cannot erase unrelated input changes", async () => {
  const store = createTripStore(trip());
  store
    .getState()
    .acceptVerification(0, await verifyTrip(trip(), demoProviders()));
  const { alternatives } = await recoverTrip(trip(), 1, demoProviders());
  store.getState().applyAlternative(0, 1, alternatives[0]);
  store.getState().update({ ...store.getState().trip, startTime: "12:07" });
  store.getState().undo();
  assert.equal(store.getState().trip.startTime, "12:07");
  assert.equal(store.getState().previous, null);
});

test("initial date uses an injected Korean day across UTC midnight boundaries", () => {
  assert.equal(koreaToday(new Date("2026-09-14T14:59:59Z")), "2026-09-14");
  assert.equal(koreaToday(new Date("2026-09-14T15:00:00Z")), "2026-09-15");
  assert.equal(initialTrip("demo", "2026-09-15").date, "2026-09-15");
});

test("feedback distinguishes repeated actions from edits and rejected stale responses", async () => {
  const store = createTripStore(trip());
  const events: string[] = [];
  const unsubscribe = store.subscribe((state, previous) => {
    if (state.feedback && state.feedback !== previous.feedback)
      events.push(state.feedback.kind);
  });
  store.getState().succeed("saved", "saved");
  store.getState().succeed("saved", "saved");
  store.getState().update({ ...store.getState().trip, startTime: "12:00" });
  store
    .getState()
    .acceptVerification(0, await verifyTrip(trip(), demoProviders()));
  assert.deepEqual(events, ["success", "success"]);
  store.getState().fail("storage denied");
  store.getState().notify("empty");
  assert.deepEqual(events, ["success", "success", "error", "info"]);
  unsubscribe();
  store.getState().succeed("saved", "saved");
  assert.equal(events.length, 4);
});

test("saved notes restore places and historical results, preserve stale inputs, and exclude raw policy", async () => {
  const { tripRecord } =
    await import("../../src/features/itinerary/state/trip-store.ts");
  const { tripRecordSchema } =
    await import("../../src/application/contracts/trip-record.ts");
  const store = createTripStore(trip());
  const result = await verifyTrip(trip(), demoProviders());
  store.getState().acceptVerification(0, result);
  const saved = tripRecord(store.getState());
  assert.ok(saved.places.length);
  assert.ok(saved.verification);
  assert.equal(JSON.stringify(saved).includes('"raw"'), false);
  assert.equal(JSON.stringify(saved).includes('"quote"'), false);
  const restored = createTripStore(initialTrip("live", "2026-09-15"));
  restored.getState().restore(tripRecordSchema.parse(saved));
  assert.equal(restored.getState().verification?.historical, true);
  assert.equal(isTripStale(restored.getState()), false);
  assert.deepEqual(
    restored.getState().verification?.result.visits.map((v) => v.status),
    result.visits.map((v) => v.status),
  );
  store.getState().update({ ...trip(), startTime: "13:00" });
  restored.getState().restore(tripRecord(store.getState()));
  assert.equal(isTripStale(restored.getState()), true);
  assert.equal(restored.getState().trip.startTime, "13:00");
});

test("draft note schema accepts incomplete itinerary without weakening verification", async () => {
  const { draftTripSchema } =
    await import("../../src/application/contracts/trip-record.ts");
  const { tripSchema } =
    await import("../../src/application/contracts/trip.ts");
  const draft = initialTrip("live", "2026-09-15");
  assert.equal(draftTripSchema.safeParse(draft).success, true);
  assert.equal(tripSchema.safeParse(draft).success, false);
});
