import { chromium, expect } from "@playwright/test";

const target = new URL(process.argv[2] || "https://www.pawproof.kr");
const liveMap = process.argv.includes("--live-map");
const local =
  target.protocol === "http:" &&
  ["localhost", "127.0.0.1"].includes(target.hostname);
if ((!local && target.protocol !== "https:") || target.username || target.password)
  throw new Error("Pass a public HTTPS or localhost app URL without credentials.");

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const checks = [];
const errors = [];

function url(path) {
  return new URL(path, target).href;
}

async function checkPage(context, path, assertion) {
  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") pageErrors.push(message.text());
  });
  const response = await page.goto(url(path), {
    waitUntil: "domcontentloaded",
    timeout: 90_000,
  });
  await assertion(page, response);
  errors.push(...pageErrors.map((message) => `${path}: ${message}`));
  if (pageErrors.length) throw new Error(`Browser errors on ${path}: ${pageErrors.join(" | ")}`);
  await page.close();
}

try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    locale: "ko-KR",
    serviceWorkers: "block",
  });

  for (const path of ["/", "/contact", "/plan?mode=live"]) {
    await checkPage(context, path, async (page, response) => {
      expect(response?.status()).toBe(200);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      ).toBe(true);
      checks.push({ path, status: response?.status(), mobileNoOverflow: true });
    });
  }

  await checkPage(context, "/contact", async (page) => {
    const fontSizes = await page.locator("input, textarea, [role=combobox]").evaluateAll(
      (elements) => elements.map((element) => getComputedStyle(element).fontSize),
    );
    expect(fontSizes.every((size) => Number.parseFloat(size) >= 16)).toBe(true);
    const submit = page.getByRole("button", { name: "문의 보내기", exact: true });
    const hasTurnstile = await page.locator(".cf-turnstile").count();
    if (hasTurnstile) await expect(submit).toBeDisabled();
    checks.push({ path: "/contact", turnstileWidget: Boolean(hasTurnstile), inputFontSizes: fontSizes });
  });

  await checkPage(context, "/plan?mode=demo", async (page) => {
    const login = page.getByRole("button", { name: "로그인하고 이어가기", exact: true });
    await expect(login).toBeVisible();
    await login.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: /Google/ })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    checks.push({ path: "/plan?mode=demo", firebaseLoginUi: true });
  });

  const anonymousTrips = await context.request.get(url("/api/account/trips"));
  expect(anonymousTrips.status()).toBe(401);
  expect(anonymousTrips.headers()["cache-control"]).toContain("no-store");
  checks.push({ path: "/api/account/trips", status: 401, anonymousRejected: true });

  const malformedContact = await context.request.post(url("/api/contact"), {
    data: {},
  });
  expect(malformedContact.status()).toBe(400);
  checks.push({ path: "/api/contact", status: 400, malformedInputRejected: true });

  if (liveMap) {
    await checkPage(context, "/plan?view=map", async (page, response) => {
      expect(response?.status()).toBe(200);
      await expect(page.locator(".map-pin").first()).toBeVisible({ timeout: 30_000 });
      await expect
        .poll(
          () =>
            page.locator(".kakao-map-canvas img").evaluateAll((images) =>
              images.filter((image) => image.complete && image.naturalWidth > 0).length,
            ),
          { timeout: 30_000 },
        )
        .toBeGreaterThan(0);
      checks.push({ path: "/plan?view=map", status: 200, kakaoMapTiles: true });
    });
  }

  console.log(
    JSON.stringify(
      {
        origin: target.origin,
        checks,
        errors,
        liveMap,
        note: "This script never submits a real contact email or creates a Firebase account. Use the explicit live Firebase script for real OAuth and notebook persistence.",
      },
      null,
      2,
    ),
  );
  await context.close();
} finally {
  await browser.close();
}
