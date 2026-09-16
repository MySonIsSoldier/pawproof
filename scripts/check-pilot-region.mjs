import { chromium, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";

// Explicit live read-only smoke test: two searches, no verification/LLM/account writes.
if (process.argv[3] !== "--live")
  throw new Error("Pass the app URL and --live");
const target = new URL(process.argv[2]);
if (target.protocol !== "https:" || target.username || target.password)
  throw new Error("A public HTTPS app URL is required");
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    locale: "ko-KR",
    serviceWorkers: "block",
  });
  const page = await context.newPage();
  let searches = 0;
  await page.route("**/api/places?*", async (route) => {
    if (++searches > 2) return route.abort();
    return route.continue();
  });
  const initial = page.waitForResponse(
    (response) => new URL(response.url()).pathname === "/api/places",
  );
  const response = await page.goto(new URL("/plan", target).href);
  expect(response.status()).toBe(200);
  const initialResponse = await initial;
  expect(initialResponse.status()).toBe(200);
  const { places } = await initialResponse.json();
  expect(places.length).toBeGreaterThan(0);
  expect(
    places.every((place) =>
      ["고양시", "파주시", "양주시"].includes(
        place.address.trim().split(/\s+/)[1],
      ),
    ),
  ).toBe(true);
  await expect(page.getByText("경기 북서부에서 먼저 둘러볼 곳")).toBeVisible();
  const food = page.waitForResponse(
    (response) =>
      new URL(response.url()).searchParams.get("category") === "카페",
  );
  await page.getByRole("button", { name: "카페", exact: true }).click();
  const foodResponse = await food;
  expect(foodResponse.status()).toBe(200);
  const cafes = (await foodResponse.json()).places;
  expect(cafes.length).toBeGreaterThan(0);
  await page
    .getByRole("button", { name: `${cafes[0].name} 담기`, exact: true })
    .click();
  const guide = page.getByRole("region", {
    name: "음식점 방문 전 공식 정보 확인",
  });
  await guide.getByRole("button").click();
  await expect(
    guide.getByRole("link", { name: /식약처 동반출입 음식점 목록/ }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await mkdir(".cache/regions", { recursive: true });
  await page.screenshot({
    path: ".cache/regions/production-mobile.png",
    fullPage: true,
  });
  console.log(
    JSON.stringify({
      plan: 200,
      places: places.length,
      cafes: cafes.length,
      officialGuide: true,
      searches,
      actualDevice: false,
    }),
  );
} finally {
  await browser.close();
}
