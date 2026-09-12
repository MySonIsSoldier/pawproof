import { test, expect } from "@playwright/test";

const activeToast =
  '[data-sonner-toast][data-front="true"]:not([data-removed="true"])';

test("action notifications refresh, dismiss by keyboard and stay out of saved data and print", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("plan?mode=demo");
  const toast = page.locator(activeToast);
  await expect(toast).toHaveCount(0);
  await page
    .getByRole("button", { name: "이 기기에 저장", exact: true })
    .click();
  await expect(toast).toHaveAttribute("data-type", "success");
  await expect(toast).toContainText("여행 노트를 이 기기에 저장했어요");
  await page
    .getByRole("button", { name: "이 기기에 저장", exact: true })
    .click();
  await expect(toast).toHaveCount(1);
  await page.keyboard.press("Alt+t");
  await expect
    .poll(() =>
      page.evaluate(
        () => !!document.activeElement?.closest("[data-sonner-toaster]"),
      ),
    )
    .toBe(true);
  const close = toast.getByRole("button", { name: "알림 닫기" });
  await close.focus();
  await page.keyboard.press("Enter");
  await expect(toast).toHaveCount(0);
  await page
    .getByRole("button", { name: "이 기기에 저장", exact: true })
    .click();
  await expect(toast).toContainText("여행 노트를 이 기기에 저장했어요");
  await expect(toast).toHaveCSS("opacity", "1");
  await expect(toast).toHaveCSS("background-color", "rgb(250, 251, 247)");
  await expect(toast).toHaveCSS("color", "rgb(25, 61, 48)");
  await page.screenshot({
    path: info.outputPath("notification.png"),
    animations: "disabled",
  });
  const bounds = await toast.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(
    page.viewportSize()!.width,
  );
  await page.emulateMedia({ media: "print" });
  await expect(toast).not.toBeVisible();
  await page.emulateMedia({ media: "screen" });
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("pawproof.trip.v1")!),
  );
  expect(Object.keys(saved).sort()).toEqual(["trip", "version"]);
  expect(saved).not.toHaveProperty("feedback");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "우리의 여행 노트" }),
  ).toBeVisible();
  await expect(toast).toHaveCount(0);
  await page.getByLabel("반려견 1 이름").fill("콩이");
  await expect(toast).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("invalid input and malformed proxy failures notify without reporting a completed check", async ({
  page,
}) => {
  await page.goto("plan?mode=demo");
  const toast = page.locator(activeToast);
  const verify = page.getByRole("button", {
    name: "이 코스 검사하기",
    exact: true,
  });
  await page.getByLabel("반려견 1 이름").fill("");
  await verify.click();
  await expect(toast).toHaveAttribute("data-type", "error");
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "반려견의 이름",
  );
  await page.getByLabel("반려견 1 이름").fill("두부");
  await page.route("**/api/verify", (route) =>
    route.fulfill({
      status: 502,
      contentType: "text/html",
      body: "<html>proxy failure</html>",
    }),
  );
  await verify.click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "서버 응답을 읽을 수 없어요",
  );
  await expect(toast).toHaveAttribute("data-type", "error");
  await page.unroute("**/api/verify");
  await verify.click();
  await expect(toast).toHaveAttribute("data-type", "success");
  await expect(toast).toContainText("코스 검사를 마쳤어요");
  await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);
  await page.getByRole("button", { name: "불러오기", exact: true }).click();
  await expect(toast).toHaveAttribute("data-type", "info");
  await expect(toast).toContainText("저장된 여행 노트가 없어요");
});

test("clipboard rejection is an error and leaving the planner clears notifications", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error("denied")) },
    });
  });
  await page.goto("plan?mode=demo");
  await page
    .getByRole("button", { name: "이 코스 검사하기", exact: true })
    .click();
  await page.locator(".preparation .ui-accordion-trigger").first().click();
  await page.getByRole("button", { name: "문의 문구 복사" }).first().click();
  await expect(page.locator(activeToast)).toHaveAttribute("data-type", "error");
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "표시된 문의 문구를 선택해 복사",
  );
  // Next's own header link exercises client navigation and HOC cleanup.
  await page
    .getByRole("link", { name: /PawProof/ })
    .first()
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "우리 강아지와",
  );
  await expect(page.locator("[data-sonner-toaster]")).toHaveCount(0);
  await page.getByRole("link", { name: "가상 코스로 체험하기" }).click();
  await expect(
    page.getByRole("heading", { name: "우리의 여행 노트" }),
  ).toBeVisible();
  await expect(page.locator(activeToast)).toHaveCount(0);
});
