import { test } from "node:test";
import assert from "node:assert/strict";
import {
  nearbyQuerySchema,
  inspectInputSchema,
} from "../../src/application/contracts/discovery.ts";
import {
  assessDiscovery,
  inquiryText,
} from "../../src/domain/policies/discovery.ts";
import { createDemoTrip, demoPlaces } from "../../src/fixtures/demo-trip.ts";
import {
  demoPolicy,
  demoProviders,
} from "../../src/infrastructure/demo/catalog.ts";
import { inspectPlaces } from "../../src/application/use-cases/inspect-places.ts";
import {
  kakaoPlaceSearch,
  telephoneLink,
} from "../../src/lib/urls/place-contact.ts";
import { ktoSource } from "../../src/infrastructure/kto/source.ts";
import {
  readableEvidence,
  readableMessage,
} from "../../src/domain/policies/presentation.ts";

test("provider field names are hidden from user-facing evidence", () => {
  assert.equal(
    readableEvidence(
      "etcAcmpyInfo: - 맹견의 경우, 입마개 착용 필수\nusetim: 상시 개방",
    ),
    "맹견의 경우, 입마개 착용 필수\n상시 개방",
  );
  assert.equal(
    readableMessage("etcAcmpyInfo: - 맹견의 경우, 입마개 착용 필수"),
    "맹견이라면 입마개를 착용해 주세요.",
  );
});

test("map filters preserve missing weight, scope and equality boundaries", () => {
  const trip = createDemoTrip("2026-09-20");
  trip.pets = [{ name: "두부", breed: "푸들", weight: 10 }];
  trip.equipment = ["목줄"];
  const policy = demoPolicy("demo-table");
  assert.equal(assessDiscovery(policy, trip, "indoor").status, "available");
  policy.rules.find((r) => r.kind === "weight")!.operator = "lt";
  assert.equal(assessDiscovery(policy, trip, "indoor").status, "blocked");
  policy.rules = policy.rules.filter((r) => r.kind !== "weight");
  assert.equal(assessDiscovery(policy, trip, "indoor").status, "confirm");
  assert.equal(assessDiscovery(undefined, trip, "indoor").status, "confirm");
  trip.pets[0].weight = 0;
  assert.equal(
    assessDiscovery(demoPolicy("demo-table"), trip, "indoor").status,
    "confirm",
  );
  const outdoor = demoPolicy("demo-table");
  outdoor.rules.forEach((r) => {
    r.scope = "outdoor";
  });
  assert.equal(assessDiscovery(outdoor, trip, "indoor").status, "confirm");
});
test("discovery contracts bound geography and expensive inspection batches", () => {
  assert.equal(
    nearbyQuerySchema.safeParse({ lat: "", lng: "" }).success,
    false,
  );
  assert.equal(
    nearbyQuerySchema.safeParse({ lat: 37.6, lng: 126.8, radius: 30000 })
      .success,
    false,
  );
  assert.equal(
    inspectInputSchema.safeParse({ ids: ["1", "1"] }).success,
    false,
  );
  assert.equal(
    inspectInputSchema.safeParse({ ids: ["1", "2", "3", "4", "5", "6"] })
      .success,
    false,
  );
});
test("inspection preserves phone on extraction failure and isolates fetch failure", async () => {
  const providers = demoProviders();
  const get = providers.places.get;
  providers.places.get = async (id) => ({
    ...(await get(id)),
    phone: "031-123-4567",
  });
  providers.extractor.extract = async () => {
    throw new Error("offline");
  };
  const result = await inspectPlaces([demoPlaces[0].id, "bad"], providers);
  assert.equal(result.checks[0].phone, "031-123-4567");
  assert.equal(result.checks[0].policy.rules.length, 0);
  assert.deepEqual(result.failedIds, ["bad"]);
});
test("nearby uses bounded type queries, coordinates, and removes invalid map points", async () => {
  let calls = 0;
  const source = ktoSource("fake", async (input) => {
    calls++;
    const u = new URL(String(input));
    assert.ok(u.pathname.endsWith("locationBasedList2"));
    assert.equal(u.searchParams.get("mapX"), "126.8");
    assert.equal(u.searchParams.get("radius"), "5000");
    assert.equal(u.searchParams.get("numOfRows"), "30");
    return Response.json({
      response: {
        header: { resultCode: "0000" },
        body: {
          items: {
            item: [
              {
                contentid: "1",
                title: "공원",
                contenttypeid: "12",
                mapx: 126.8,
                mapy: 37.6,
              },
              { contentid: "2", title: "좌표 없음", contenttypeid: "12" },
            ],
          },
        },
      },
    });
  });
  assert.equal(
    (await source.around!({ lat: 37.6, lng: 126.8 }, 5000)).length,
    1,
  );
  assert.equal(calls, 4);
});
test("contact links cannot turn ambiguous numbers into a wrong call and questions include party", () => {
  assert.equal(telephoneLink("031-123-4567"), "tel:0311234567");
  assert.equal(telephoneLink("031-123-4567 / 010-1234-5678"), null);
  assert.equal(telephoneLink("javascript:alert(1)"), null);
  assert.ok(
    kakaoPlaceSearch(demoPlaces[0]).startsWith(
      "https://map.kakao.com/link/search/",
    ),
  );
  const trip = createDemoTrip("2026-09-20");
  const inquiry = inquiryText(
    demoPlaces[0],
    trip,
    "outdoor",
    assessDiscovery(undefined, trip, "outdoor").findings,
  );
  assert.ok(inquiry.includes("2026-09-20"));
  assert.ok(inquiry.includes("야외/테라스"));
});
