import { chromium, expect } from "@playwright/test";

// Public client smoke only: synthetic search, no account or paid-service requests.
const target = new URL(process.argv[2]);
if (target.protocol !== "https:" || target.username || target.password)
  throw new Error("Pass a public HTTPS app URL without credentials.");
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
  await page.route("**/api/places?*", (route) =>
    route.fulfill({ json: { places: [] } }),
  );
  const response = await page.goto(new URL("/plan?mode=demo", target).href, {
    waitUntil: "networkidle",
  });
  expect(response.status()).toBe(200);
  const notebook = page.getByRole("region", { name: "계정 여행 노트" });
  await expect(
    notebook.getByRole("button", { name: "로그인하고 이어가기" }),
  ).toBeVisible();
  expect((await notebook.boundingBox()).y).toBeLessThan(
    (await page.locator(".planner-grid").boundingBox()).y,
  );
  await expect(
    page.getByRole("button", { name: "이 기기에 저장", exact: true }),
  ).toHaveCount(0);
  await page
    .getByLabel("반려견 1 이름", { exact: true })
    .fill("배포 확인 입력");
  const cancelEvent = page.waitForEvent("dialog").then(async (dialog) => {
    expect(dialog.type()).toBe("beforeunload");
    await dialog.dismiss();
  });
  await Promise.all([cancelEvent, page.evaluate(() => location.reload())]);
  await expect(page.getByLabel("반려견 1 이름", { exact: true })).toHaveValue(
    "배포 확인 입력",
  );
  expect(
    await page.evaluate(() => localStorage.getItem("pawproof.trip.v1")),
  ).toBeNull();
  const acceptEvent = page.waitForEvent("dialog").then(async (dialog) => {
    expect(dialog.type()).toBe("beforeunload");
    await dialog.accept();
  });
  await Promise.all([acceptEvent, page.reload()]);
  await expect(page.getByLabel("반려견 1 이름", { exact: true })).toHaveValue(
    "두부",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(page.getByLabel("장소 검색", { exact: true })).toBeEnabled();
  await page.screenshot({
    caret: "initial",
    path: ".cache/pawproof-notebook-production.png",
    fullPage: true,
  });
  console.log(
    JSON.stringify({
      plan: 200,
      topLoginPrompt: true,
      deviceSavingRemoved: true,
      refreshCancelPreservesInput: true,
      refreshAcceptClearsInput: true,
      actualIPhoneTested: false,
      accountWrites: 0,
    }),
  );
} finally {
  await browser.close();
}
