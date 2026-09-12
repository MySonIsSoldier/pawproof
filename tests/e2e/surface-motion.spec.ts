import { test, expect } from "@playwright/test";

test("installation dialog has an opaque surface, bounded scroll and animated dismissal", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const names: string[] = [];
    Object.assign(window, { surfaceAnimations: names });
    document.addEventListener("animationstart", (event) =>
      names.push(event.animationName),
    );
  });
  await page.goto("./");
  const trigger = page.getByRole("button", { name: "PawProof 앱 설치 안내" });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toHaveCSS("background-color", "rgb(250, 251, 247)");
  await expect(dialog).toHaveCSS("color", "rgb(25, 61, 48)");
  await expect(dialog).toHaveCSS("border-radius", "20px");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { surfaceAnimations: string[] })
            .surfaceAnimations,
      ),
    )
    .toContain("dialog-in");
  await page.setViewportSize({ width: 320, height: 480 });
  await dialog.evaluate(async (element) => {
    await Promise.all(
      element.getAnimations().map((animation) => animation.finished),
    );
  });
  const bounds = await dialog.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(15);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(305);
  expect(bounds!.y).toBeGreaterThanOrEqual(15);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(465);
  expect(
    await dialog.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true);
  await dialog.getByText(/앱을 설치해도 여행/).scrollIntoViewIfNeeded();
  await expect(dialog.getByText(/앱을 설치해도 여행/)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { surfaceAnimations: string[] })
          .surfaceAnimations,
    ),
  ).toContain("dialog-out");
  await trigger.click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "설치 안내 닫기" }).click();
  await expect(dialog).toHaveCount(0);
});

test("FAQ uses Radix keyboard navigation, independent panels and reversible height motion", async ({
  page,
}) => {
  await page.goto("./");
  const triggers = page.locator(".faq .ui-accordion-trigger");
  const first = triggers.nth(0);
  const second = triggers.nth(1);
  const firstPanel = page.locator(".faq .ui-accordion-content").nth(0);
  await first.focus();
  await page.keyboard.press("Enter");
  await expect(first).toHaveAttribute("aria-expanded", "true");
  await expect(firstPanel).toHaveCSS("animation-name", "accordion-down");
  await page.keyboard.press("ArrowDown");
  await expect(second).toBeFocused();
  await page.keyboard.press("Space");
  await expect(second).toHaveAttribute("aria-expanded", "true");
  await expect(first).toHaveAttribute("aria-expanded", "true");
  await first.click();
  await expect(first).toHaveAttribute("aria-expanded", "false");
  await expect(firstPanel).toBeHidden();
  await expect(second).toHaveAttribute("aria-expanded", "true");
  await first.click();
  await expect(firstPanel).toBeVisible();
});

test("reduced motion leaves dialogs and accordion functional without animation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");
  await page.getByRole("button", { name: "PawProof 앱 설치 안내" }).click();
  await expect(page.getByRole("dialog")).toHaveCSS("animation-name", "none");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.locator(".faq .ui-accordion-trigger").first().click();
  await expect(page.locator(".faq .ui-accordion-content").first()).toHaveCSS(
    "animation-name",
    "none",
  );
});
