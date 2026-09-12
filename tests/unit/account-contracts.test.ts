import test from "node:test";
import assert from "node:assert/strict";
import { parseFirebaseWebConfig } from "../../src/config/firebase.ts";
import {
  saveTripSchema,
  tripIdSchema,
} from "../../src/application/contracts/saved-trip.ts";
import { initialTrip } from "../../src/features/itinerary/state/initial-trip.ts";
test("Firebase config exposes only allowed web identifiers and rejects partial config", () => {
  assert.equal(parseFirebaseWebConfig({ projectId: "example-project" }), null);
  const value = parseFirebaseWebConfig({
    apiKey: "example",
    authDomain: "example.firebaseapp.com",
    projectId: "example-project",
    appId: "example",
    privateKey: "not public",
  });
  assert.deepEqual(Object.keys(value!).sort(), [
    "apiKey",
    "appId",
    "authDomain",
    "projectId",
  ]);
  assert.equal(
    parseFirebaseWebConfig({
      ...value,
      authDomain: "https://example.com/path",
    }),
    null,
  );
});
test("account writes reject ownership injection, raw data, invalid revisions and document traversal", () => {
  const input = {
    title: "  여행 노트  ",
    trip: initialTrip("demo", "2026-09-20"),
    expectedRevision: 0,
  };
  assert.equal(saveTripSchema.parse(input).title, "여행 노트");
  for (const extra of [
    { ownerId: "another-user" },
    { rawText: "API text" },
    { expectedRevision: -1 },
    { title: " " },
  ])
    assert.equal(
      saveTripSchema.safeParse({ ...input, ...extra }).success,
      false,
    );
  assert.equal(
    saveTripSchema.safeParse({
      ...input,
      trip: { ...input.trip, verification: { status: "pass" } },
    }).success,
    false,
  );
  assert.equal(
    tripIdSchema.safeParse("../accounts/another-user").success,
    false,
  );
});
