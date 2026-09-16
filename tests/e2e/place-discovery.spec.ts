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
  // Reproduce browsers that lack the newer AbortSignal static methods.
  await page.addInitScript(() => {
    Object.defineProperty(AbortSignal, "any", { value: undefined });
    Object.defineProperty(AbortSignal, "timeout", { value: undefined });
  });
  await page.route("**/api/places?*", (route) =>
    route.fulfill({ json: { places } }),
  );
  await page.goto("plan");
  await expect(page.getByText("경기 북서부에서 먼저 둘러볼 곳")).toBeVisible();
  await expect(page.getByText(places[0].name, { exact: true })).toBeVisible();
  await page.getByLabel("장소 검색").fill("인천");
  await page.getByRole("button", { name: "검색", exact: true }).click();
  await page.reload();
  await expect(page.getByText("최근 검색", { exact: true })).toBeVisible();
  await page
    .locator(".search-suggestions")
    .getByRole("button", { name: "인천", exact: true })
    .click();
  await expect(page.getByLabel("장소 검색")).toHaveValue("인천");
  await page.reload();
  await page.getByRole("button", { name: "기록 지우기" }).click();
  await expect(page.getByText("최근 검색", { exact: true })).toHaveCount(0);
});
test("guest ignores old device notes and offers account saving at the top", async ({
  page,
}) => {
  await page.addInitScript((trip) => {
    localStorage.setItem(
      "pawproof.trip.v1",
      JSON.stringify({ version: 1, trip }),
    );
  }, createDemoTrip("2026-09-20"));
  await page.goto("plan");
  await expect(page.locator(".visit-card")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "이 기기에 저장", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "불러오기", exact: true }),
  ).toHaveCount(0);
  const panel = page.getByRole("region", { name: "계정 여행 노트" });
  await expect(
    panel.getByRole("button", { name: "로그인하고 이어가기" }),
  ).toBeVisible();
  const panelBox = (await panel.boundingBox())!;
  expect(panelBox.y).toBeLessThan(
    (await page.locator(".planner-grid").boundingBox())!.y,
  );
});
