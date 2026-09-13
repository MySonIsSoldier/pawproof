import { chromium, expect } from "@playwright/test";

// Read-only production smoke: open and close OAuth, never submit account credentials.
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
  });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "standalone", { value: true });
    const open = window.open.bind(window);
    window.open = (...args) => {
      document.documentElement.dataset.oauthFocusReleased = String(
        !document.querySelector('[role="dialog"]') &&
          !document.querySelector("[data-radix-focus-guard]") &&
          !document.body.hasAttribute("data-scroll-locked") &&
          getComputedStyle(document.body).pointerEvents !== "none",
      );
      return open(...args);
    };
  });
  const page = await context.newPage();
  const response = await page.goto(target.href, { waitUntil: "networkidle" });
  expect(response.status()).toBe(200);
  await page
    .getByRole("banner")
    .getByRole("button", { name: "로그인", exact: true })
    .click();
  const popupEvent = page.waitForEvent("popup", { timeout: 30_000 });
  await page.getByRole("button", { name: "Google로 계속하기" }).click();
  const popup = await popupEvent;
  await expect(page.locator("html")).toHaveAttribute(
    "data-oauth-focus-released",
    String(!baseline),
  );
  await popup.close();
  if (!baseline) {
    const back = page.getByRole("button", { name: "로그인 화면으로 돌아가기" });
    if (await back.isVisible()) await back.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "계정 안내 닫기" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }
  console.log(
    JSON.stringify({
      homepage: 200,
      oauthPopupOpened: true,
      modalLocksReleased: !baseline,
      credentialsSubmitted: false,
      actualIPhoneKeyboardTested: false,
    }),
  );
} finally {
  await browser.close();
}
