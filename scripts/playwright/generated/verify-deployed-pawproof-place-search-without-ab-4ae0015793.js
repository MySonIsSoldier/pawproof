import { chromium, expect } from "@playwright/test";

// Exercise deployed client code with synthetic responses; no paid APIs or account writes.
const target = new URL(process.argv[2]);
if (target.protocol !== "https:" || target.username || target.password)
  throw new Error("Pass a public HTTPS app URL without credentials.");
const baseline = process.argv[3] === "--baseline";
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    locale: "ko-KR",
    serviceWorkers: "block",
  });
  await context.addInitScript((baseline) => {
    Object.defineProperty(AbortSignal, "any", { value: undefined });
    if (!baseline)
      Object.defineProperty(AbortSignal, "timeout", { value: undefined });
  }, baseline);
  const page = await context.newPage();
  let placeRequests = 0;
  await page.route("**/api/places?*", (route) => {
    placeRequests++;
    return route.fulfill({
      json: {
        places: [
          {
            id: "8000",
            name: "인천 호환성 테스트 방문지",
            address: "인천광역시 중구",
            category: "관광지",
            source: "kto",
            lat: 37.4,
            lng: 126.6,
          },
        ],
      },
    });
  });
  const response = await page.goto(new URL("/plan", target).href, {
    waitUntil: "networkidle",
  });
  expect(response.status()).toBe(200);
  if (baseline) {
    await page.getByLabel("장소 검색").fill("인천");
    await page.getByRole("button", { name: "검색", exact: true }).click();
    await expect(
      page.getByText(/AbortSignal\.any.*function/).first(),
    ).toBeVisible();
    expect(placeRequests).toBe(0);
  } else {
    await expect(
      page.getByText("인천 호환성 테스트 방문지", { exact: true }),
    ).toBeVisible();
    await page.getByLabel("장소 검색").fill("인천");
    const searched = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === "/api/places" &&
        new URL(response.url()).searchParams.get("q") === "인천",
    );
    await page.getByRole("button", { name: "검색", exact: true }).click();
    await searched;
    await expect(
      page.getByText("인천 호환성 테스트 방문지", { exact: true }),
    ).toBeVisible();
    expect(placeRequests).toBeGreaterThanOrEqual(2);
  }
  console.log(
    JSON.stringify({
      plan: 200,
      baselineFailureReproduced: baseline,
      compatibleSearchPassed: !baseline,
      syntheticPlaceRequests: placeRequests,
      actualIPhoneTested: false,
    }),
  );
} finally {
  await browser.close();
}
