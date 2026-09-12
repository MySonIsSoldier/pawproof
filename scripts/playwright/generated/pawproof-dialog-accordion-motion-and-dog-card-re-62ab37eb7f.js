import { chromium, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const origin = process.argv[2] || "http://localhost:3000/absproxy/3000/";
const output = ".cache/ui-polish";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const width of [320, 360, 390, 768, 1024, 1440]) {
    const context = await browser.newContext({
      viewport: { width, height: width < 720 ? 844 : 1000 },
      isMobile: width < 720,
      hasTouch: width < 720,
      locale: "ko-KR",
      timezoneId: "Asia/Seoul",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.goto(origin, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await expect
      .poll(() =>
        page
          .locator(".hero-art img")
          .evaluateAll((images) =>
            images.every((image) => image.complete && image.naturalWidth > 0),
          ),
      )
      .toBe(true);
    await page.locator(".hero-art").evaluate(async (element) => {
      await Promise.all(
        element
          .getAnimations({ subtree: true })
          .map((animation) => animation.finished),
      );
    });
    console.log(
      JSON.stringify(
        await page.evaluate(
          (expectedWidth) => ({
            expectedWidth,
            innerWidth,
            scrollWidth: document.documentElement.scrollWidth,
            outside: Array.from(document.querySelectorAll("body *"))
              .filter((element) => {
                const bounds = element.getBoundingClientRect();
                return bounds.width > 0 && bounds.right > expectedWidth + 1;
              })
              .slice(0, 12)
              .map((element) => ({
                tag: element.tagName,
                className: element.getAttribute("class"),
                right: element.getBoundingClientRect().right,
              })),
          }),
          width,
        ),
      ),
    );
    await expect
      .poll(() =>
        page.evaluate(
          (expectedWidth) =>
            document.documentElement.scrollWidth <= expectedWidth &&
            innerWidth === expectedWidth,
          width,
        ),
      )
      .toBe(true);
    expect(
      await page.locator(".photo-stamp").evaluate((element) => {
        const box = element.getBoundingClientRect();
        return (
          element.scrollWidth <= element.clientWidth &&
          element.scrollHeight <= element.clientHeight &&
          box.left >= 0 &&
          box.right <= innerWidth
        );
      }),
    ).toBe(true);
    await page.screenshot({
      path: `${output}/home-${width}.png`,
      fullPage: true,
    });
    {
      const toggle = page.getByRole("button", { name: "강아지 사진 펼침" });
      if (width < 720) await toggle.tap();
      else await page.locator(".hero-art").hover();
      await expect(toggle).toHaveAttribute("aria-pressed", "true");
      await page.locator(".hero-art").evaluate(async (element) => {
        await Promise.all(
          element
            .getAnimations({ subtree: true })
            .map((animation) => animation.finished),
        );
      });
      await page.screenshot({
        path: `${output}/hover-${width}.png`,
        fullPage: true,
      });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    await page.getByRole("button", { name: "PawProof 앱 설치 안내" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await dialog.evaluate(async (element) => {
      await Promise.all(
        element.getAnimations().map((animation) => animation.finished),
      );
    });
    expect(
      await dialog.evaluate((element, expectedWidth) => {
        const box = element.getBoundingClientRect();
        return (
          box.left >= 15 &&
          box.right <= expectedWidth - 15 &&
          box.top >= 15 &&
          box.bottom <= innerHeight - 15 &&
          element.scrollWidth <= element.clientWidth
        );
      }, width),
    ).toBe(true);
    await page.screenshot({ path: `${output}/install-${width}.png` });
    await page.getByRole("button", { name: "설치 안내 닫기" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "PawProof 앱 설치 안내" }),
    ).toBeFocused();
    const faq = page.getByRole("button", {
      name: "이용 가능이면 입장이 보장되나요?",
    });
    await faq.click();
    await expect(faq).toHaveAttribute("aria-expanded", "true");
    await expect(
      page.getByText("조회한 규정과 입력한 조건을 대조한 결과예요.", {
        exact: false,
      }),
    ).toBeVisible();
    await faq.click();
    await expect(faq).toHaveAttribute("aria-expanded", "false");
    expect(errors).toEqual([]);
    results.push({ width, result: "passed" });
    await context.close();
  }
  console.log(JSON.stringify({ results, screenshots: output }, null, 2));
} finally {
  await browser.close();
}
