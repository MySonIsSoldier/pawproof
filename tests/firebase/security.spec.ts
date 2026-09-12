import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { auth, db, createUser } from "./helpers";
import { initialTrip } from "../../src/features/itinerary/state/initial-trip";

const path = "./api/account/trips";
test("server enforces authentication, ownership, strict input and optimistic revisions", async ({
  request,
}) => {
  const first = await createUser();
  const second = await createUser();
  const unverified = await createUser(false);
  const headers = { Authorization: `Bearer ${first.token}` };
  const other = { Authorization: `Bearer ${second.token}` };
  const id = randomUUID();
  const input = {
    title: "우리의 인천 여행",
    trip: initialTrip("demo", "2026-09-20"),
    expectedRevision: 0,
  };
  expect((await request.get(path)).status()).toBe(401);
  expect(
    (
      await request.get(path, { headers: { Authorization: "Bearer forged" } })
    ).status(),
  ).toBe(401);
  expect(
    (
      await request.get(path, {
        headers: { Authorization: `Bearer ${unverified.token}` },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.put(`${path}/${id}`, {
        headers,
        data: { ...input, ownerId: second.uid },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.put(`${path}/${id}`, {
        headers,
        data: { ...input, trip: { ...input.trip, rawText: "must not store" } },
      })
    ).status(),
  ).toBe(400);
  const save = await request.put(`${path}/${id}`, { headers, data: input });
  expect(save.status()).toBe(200);
  expect((await save.json()).revision).toBe(1);
  expect(await (await request.get(path, { headers: other })).json()).toEqual(
    [],
  );
  expect(
    (
      await request.delete(`${path}/${id}`, {
        headers: other,
        data: { expectedRevision: 1 },
      })
    ).status(),
  ).toBe(404);
  const update = await request.put(`${path}/${id}`, {
    headers,
    data: { ...input, title: "변경한 제목", expectedRevision: 1 },
  });
  expect(update.status()).toBe(200);
  expect(
    (
      await request.put(`${path}/${id}`, {
        headers,
        data: { ...input, expectedRevision: 1 },
      })
    ).status(),
  ).toBe(409);
  expect(
    (
      await request.delete(`${path}/${id}`, {
        headers,
        data: { expectedRevision: 1 },
      })
    ).status(),
  ).toBe(409);
  const stored = (
    await db.doc(`accounts/${first.uid}/trips/${id}`).get()
  ).data()!;
  expect(Object.keys(stored).sort()).toEqual([
    "createdAt",
    "revision",
    "title",
    "trip",
    "updatedAt",
  ]);
  expect(
    (
      await request.delete(`${path}/${id}`, {
        headers,
        data: { expectedRevision: 2 },
      })
    ).status(),
  ).toBe(200);
  expect(await (await request.get(path, { headers })).json()).toEqual([]);
  await auth.updateUser(first.uid, { disabled: true });
  expect((await request.get(path, { headers })).status()).toBe(401);
});

test("browser cannot bypass the server and concurrent creation respects the account limit", async ({
  request,
}) => {
  const user = await createUser();
  const headers = { Authorization: `Bearer ${user.token}` };
  const input = {
    title: "저장 한도 확인",
    trip: initialTrip("demo", "2026-09-20"),
    expectedRevision: 0,
  };
  const results = await Promise.all(
    Array.from({ length: 21 }, () =>
      request.put(`${path}/${randomUUID()}`, { headers, data: input }),
    ),
  );
  expect(results.filter((result) => result.status() === 200)).toHaveLength(20);
  expect(results.filter((result) => result.status() === 409)).toHaveLength(1);
  const direct = await fetch(
    `http://127.0.0.1:8080/v1/projects/demo-pawproof/databases/(default)/documents/accounts/${user.uid}/trips`,
    { headers },
  );
  expect(direct.status).toBe(403);
});
