import { test, expect } from "@playwright/test";

async function finishMotion(element: import("@playwright/test").Locator) {
  await element.evaluate(async (node) => {
    await Promise.all(
      node
        .getAnimations({ subtree: true })
        .map((animation) => animation.finished),
    );
  });
}

test("matching dog cards open with hover or touch and remain usable with reduced motion", async ({
  page,
  isMobile,
}) => {
  await page.goto("./");
  const art = page.locator(".hero-art");
  const front = page.locator(".hero-photo");
  const back = page.locator(".photo-backdrop");
  const toggle = page.getByRole("button", { name: "강아지 사진 펼침" });
  await expect
    .poll(() =>
      art
        .locator("img")
        .evaluateAll(
          (images) =>
            images.length === 2 &&
            images.every(
              (image) =>
                image instanceof HTMLImageElement &&
                image.complete &&
                image.naturalWidth > 0,
            ),
        ),
    )
    .toBe(true);
  const shape = (node: Element) => {
    const style = getComputedStyle(node);
    return [style.width, style.height, style.borderRadius];
  };
  expect(await front.evaluate(shape)).toEqual(await back.evaluate(shape));
  await finishMotion(art);
  const initialFront = await front.evaluate(
    (node) => getComputedStyle(node).transform,
  );
  const initialBack = await back.evaluate(
    (node) => getComputedStyle(node).transform,
  );
  if (isMobile) await toggle.tap();
  else await art.hover();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(front).not.toHaveCSS("transform", initialFront);
  await expect(back).not.toHaveCSS("transform", initialBack);
  await finishMotion(art);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  if (isMobile) await toggle.tap();
  else await page.mouse.move(1, 1);
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await expect(front).toHaveCSS("transform", initialFront);
  await expect(back).toHaveCSS("transform", initialBack);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(front).not.toHaveCSS("transform", initialFront);
  await expect(front).toHaveCSS("transition-duration", "0s");
  await page.keyboard.press("Space");
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await expect(front).toHaveCSS("transform", initialFront);
  if (!isMobile) {
    await art.hover();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await expect(front).not.toHaveCSS("transform", initialFront);
  }
});

test("stamp text fits within its circle and landing stays within narrow and desktop widths", async ({
  page,
}) => {
  await page.goto("./");
  await page.evaluate(() => document.fonts.ready);
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await finishMotion(page.locator(".hero-art"));
    const sizes = await page
      .locator(".photo-stamp")
      .evaluate((node, expectedWidth) => {
        const stamp = node as HTMLElement;
        return {
          fits:
            stamp.scrollWidth <= stamp.clientWidth &&
            stamp.scrollHeight <= stamp.clientHeight,
          textFits: Array.from(stamp.querySelectorAll("span")).every(
            (text) => text.offsetWidth <= stamp.clientWidth - 10,
          ),
          pageFits:
            document.documentElement.scrollWidth <= expectedWidth &&
            innerWidth === expectedWidth,
        };
      }, width);
    expect(sizes, `viewport ${width}`).toEqual({
      fits: true,
      textFits: true,
      pageFits: true,
    });
  }
});

test.describe("standalone and hybrid input", () => {
  test.use({ hasTouch: true });
  test("installed app supports tap toggling and a connected mouse", async ({
    page,
  }) => {
    await page.addInitScript(() =>
      Object.defineProperty(navigator, "standalone", { value: true }),
    );
    await page.goto("./");
    await expect(
      page.getByRole("button", { name: "PawProof 앱 설치 안내" }),
    ).toHaveCount(0);
    const toggle = page.getByRole("button", { name: "강아지 사진 펼침" });
    await toggle.tap();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await toggle.tap();
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await page.mouse.move(1, 1);
    await toggle.hover();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await page.mouse.move(1, 1);
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
  });
});
