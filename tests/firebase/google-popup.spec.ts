import { test, expect, type Page } from "@playwright/test";
import { email } from "./helpers";

async function openLogin(page: Page) {
  await page.goto("./");
  await page
    .getByRole("banner")
    .getByRole("button", { name: "로그인", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Google로 계속하기" }),
  ).toBeEnabled();
}

test.beforeEach(async ({ page }, info) => {
  // Standalone signal only: this does not emulate the iPhone OS keyboard.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "standalone", { value: true });
    const open = window.open.bind(window);
    window.open = (...args) => {
      const released =
        !document.querySelector('[role="dialog"]') &&
        !document.querySelector("[data-radix-focus-guard]") &&
        !document.body.hasAttribute("data-scroll-locked") &&
        getComputedStyle(document.body).pointerEvents !== "none";
      document.documentElement.dataset.oauthFocusReleased = String(released);
      return open(...args);
    };
    const dispatch = EventTarget.prototype.dispatchEvent;
    EventTarget.prototype.dispatchEvent = function (event) {
      if (this instanceof HTMLAnchorElement && event.type === "click") {
        document.documentElement.dataset.oauthFocusReleased = String(
          !document.querySelector('[role="dialog"]') &&
            !document.querySelector("[data-radix-focus-guard]") &&
            !document.body.hasAttribute("data-scroll-locked") &&
            getComputedStyle(document.body).pointerEvents !== "none",
        );
      }
      return dispatch.call(this, event);
    };
  });
  if (info.title.includes("iOS standalone"))
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "userAgent", {
        value:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1",
      });
    });
});

test("Google popup releases modal input locks and completes login to the planner", async ({
  page,
}) => {
  await openLogin(page);
  const popupEvent = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Google로 계속하기" }).click();
  const popup = await popupEvent;
  await expect(page.locator("html")).toHaveAttribute(
    "data-oauth-focus-released",
    "true",
  );
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await popup.getByRole("button", { name: "Add new account" }).click();
  // The Auth emulator widget has no correctly associated accessible Email label.
  const input = popup.locator("#email-input");
  await input.click();
  await expect(input).toBeFocused();
  const address = email();
  await popup.keyboard.type(address);
  await expect(input).toHaveValue(address);
  await popup.getByRole("button", { name: "Sign in with Google" }).click();
  await expect(page).toHaveURL(/\/plan(?:\?|$)/);
  await expect(
    page.locator('[data-sonner-toast][data-type="success"]'),
  ).toContainText("Google 계정으로 로그인했어요.");
  await expect(
    page.getByRole("banner").getByRole("link", { name: /프로필/ }),
  ).toBeVisible();
});

test("closing Google popup restores an editable login dialog and allows retry", async ({
  page,
}) => {
  await openLogin(page);
  const popupEvent = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Google로 계속하기" }).click();
  const popup = await popupEvent;
  await expect(page.locator("html")).toHaveAttribute(
    "data-oauth-focus-released",
    "true",
  );
  await popup.close();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("alert")).toContainText("로그인을 취소했어요");
  await dialog.getByLabel("이메일", { exact: true }).fill(email());
  await expect(dialog.getByLabel("이메일", { exact: true })).toBeFocused();
  const retryEvent = page.waitForEvent("popup");
  await dialog.getByRole("button", { name: "Google로 계속하기" }).click();
  const retry = await retryEvent;
  await expect(dialog).toHaveCount(0);
  await retry.close();
  await expect(dialog.getByRole("alert")).toContainText("로그인을 취소했어요");
});

test("blocked Google popup restores email login without leaving the page locked", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.open = () => null;
  });
  await openLogin(page);
  await page.getByRole("button", { name: "Google로 계속하기" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("alert")).toContainText(
    "로그인 팝업이 차단됐어요",
  );
  await dialog.getByLabel("이메일", { exact: true }).fill(email());
  await dialog.getByRole("button", { name: "계정 안내 닫기" }).click();
  await expect(dialog).toHaveCount(0);
  await expect
    .poll(() =>
      page
        .locator("body")
        .evaluate((body) => getComputedStyle(body).pointerEvents),
    )
    .not.toBe("none");
});

test("iOS standalone Google popup can return from waiting and retry without stale cancellation", async ({
  page,
  context,
}) => {
  await openLogin(page);
  // Firebase's iOS branch dispatches an anchor click; Chromium may use noopener.
  const popupEvent = context.waitForEvent("page");
  await page.getByRole("button", { name: "Google로 계속하기" }).click();
  const popup = await popupEvent;
  await expect(page.locator("html")).toHaveAttribute(
    "data-oauth-focus-released",
    "true",
  );
  await popup.close();
  await page.getByRole("button", { name: "로그인 화면으로 돌아가기" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  const retryEvent = context.waitForEvent("page");
  await page.getByRole("button", { name: "Google로 계속하기" }).click();
  const retry = await retryEvent;
  await retry.getByRole("button", { name: "Add new account" }).click();
  const input = retry.locator("#email-input");
  await input.click();
  await expect(input).toBeFocused();
  const address = email();
  await retry.keyboard.type(address);
  await expect(input).toHaveValue(address);
  // Starting this request cancels the previous Firebase promise; waiting must persist.
  await expect(
    page.getByRole("region", { name: "Google 로그인 진행" }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  // This Chromium/iOS-signal combination has no opener for the emulator callback.
  // Actual OAuth completion is covered by the regular popup test, not faked here.
  await retry.close();
  await page.getByRole("button", { name: "로그인 화면으로 돌아가기" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Google 로그인 진행" }),
  ).toHaveCount(0);
  await expect(page.getByRole("dialog").getByRole("alert")).toHaveCount(0);
});
