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

test("two dog cards load, fan out only with a mouse and return to their original arrangement", async ({
  page,
  isMobile,
}) => {
  await page.goto("./");
  const art = page.locator(".hero-art");
  const front = page.locator(".hero-photo");
  const back = page.locator(".photo-backdrop");
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
  await finishMotion(art);
  const initialFront = await front.evaluate(
    (node) => getComputedStyle(node).transform,
  );
  const initialBack = await back.evaluate(
    (node) => getComputedStyle(node).transform,
  );
  if (isMobile) {
    await front.tap();
    await expect(front).toHaveCSS("transform", initialFront);
    await expect(back).toHaveCSS("transform", initialBack);
  } else {
    await art.hover();
    await finishMotion(art);
    await expect(front).not.toHaveCSS("transform", initialFront);
    await expect(back).not.toHaveCSS("transform", initialBack);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.mouse.move(1, 1);
    await finishMotion(art);
    await expect(front).toHaveCSS("transform", initialFront);
    await expect(back).toHaveCSS("transform", initialBack);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await art.hover();
    await expect(front).toHaveCSS("transform", initialFront);
    await expect(back).toHaveCSS("transform", initialBack);
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
