import { test, expect } from "@playwright/test";
import { createDemoTrip } from "../../src/fixtures/demo-trip";
const places = [0, 1, 2].map((i) => ({
  id: String(8000 + i),
  name: `인천 테스트 방문지 ${i + 1}`,
  address: "인천광역시 중구",
  category: "관광지",
  source: "kto",
  lat: 37.4,
  lng: 126.6,
}));
test("discovery appears before typing and recent search terms can be reused or removed", async ({
  page,
}) => {
  await page.route("**/api/places?*", (route) =>
    route.fulfill({ json: { places } }),
  );
  await page.goto("plan");
  await expect(page.getByText("인천에서 먼저 둘러볼 곳")).toBeVisible();
  await expect(page.getByText(places[0].name, { exact: true })).toBeVisible();
  await page.getByLabel("장소 검색").fill("인천");
  await page.getByRole("button", { name: "검색", exact: true }).click();
  await page.reload();
  await expect(page.getByText("최근 검색", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "인천", exact: true }).click();
  await expect(page.getByLabel("장소 검색")).toHaveValue("인천");
  await page.reload();
  await page.getByRole("button", { name: "기록 지우기" }).click();
  await expect(page.getByText("최근 검색", { exact: true })).toHaveCount(0);
});
test("legacy input-only notes resolve real place names without inventing old verification", async ({
  page,
}) => {
  const trip = {
    ...createDemoTrip("2026-09-20"),
    mode: "live",
    visits: createDemoTrip("2026-09-20")
      .visits.slice(0, 3)
      .map((v, i) => ({ ...v, placeId: places[i].id })),
  };
  await page.route("**/api/places?*", (route) =>
    route.fulfill({ json: { places } }),
  );
  await page.route(/\/api\/places\/\d+$/, (route) =>
    route.fulfill({
      json: places.find((p) => route.request().url().endsWith(p.id)),
    }),
  );
  await page.goto("plan");
  await page.evaluate(
    (trip) =>
      localStorage.setItem(
        "pawproof.trip.v1",
        JSON.stringify({ version: 1, trip }),
      ),
    trip,
  );
  await page.getByRole("button", { name: "불러오기", exact: true }).click();
  await expect(page.locator(".visit-card")).toHaveCount(3);
  await expect(page.locator(".visit-card").first()).toContainText(
    places[0].name,
  );
  await expect(
    page.getByRole("heading", { name: "코스 확인 결과" }),
  ).toHaveCount(0);
});
