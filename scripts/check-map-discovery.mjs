import { chromium, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";

if (process.argv[3] !== "--live")
  throw new Error("Pass the app URL and --live");
const target = new URL(process.argv[2]);
if (target.protocol !== "https:" || target.username || target.password)
  throw new Error("Pass a public HTTPS app URL");
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    serviceWorkers: "block",
    locale: "ko-KR",
  });
  const page = await context.newPage();
  let searches = 0;
  await page.route("**/api/discovery/nearby?*", (route) =>
    ++searches > 2 ? route.abort() : route.continue(),
  );
  await page.route("**/api/discovery/inspect", (route) => route.abort());
  const nearby = page.waitForResponse((r) =>
    new URL(r.url()).pathname.endsWith("/api/discovery/nearby"),
  );
  const response = await page.goto(new URL("/plan", target).href);
  expect(response.status()).toBe(200);
  const found = await nearby;
  expect(found.status()).toBe(200);
  const places = (await found.json()).places;
  expect(places.length).toBeGreaterThan(0);
  await expect(page.locator(".map-pin").first()).toBeVisible({
    timeout: 25000,
  });
  await expect
    .poll(
      () =>
        page
          .locator(".kakao-map-canvas img")
          .evaluateAll(
            (images) =>
              images.filter((image) => image.complete && image.naturalWidth > 0)
                .length,
          ),
      { timeout: 25000 },
    )
    .toBeGreaterThan(0);
  await page.locator(".explore-result").first().click();
  await expect(
    page.getByRole("link", { name: /카카오맵에서 상호/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "코스에 담기", exact: true }).click();
  await page.getByRole("button", { name: "여행 노트 1곳 보기 →" }).click();
  await expect(page.locator(".visit-card")).toHaveCount(1);
  await page
    .getByRole("button", { name: "지도에서 찾기", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "코스에 담았어요" }),
  ).toBeDisabled();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await mkdir(".cache/maps", { recursive: true });
  await page.screenshot({
    path: `.cache/maps/${target.hostname}.png`,
    fullPage: true,
  });
  console.log(
    JSON.stringify({
      host: target.hostname,
      plan: 200,
      sdkAndTiles: true,
      candidates: places.length,
      searches,
      notebookPreserved: true,
      actualDevice: false,
      llmCalls: 0,
    }),
  );
} finally {
  await browser.close();
}
