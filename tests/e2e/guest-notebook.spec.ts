import { test, expect } from "@playwright/test";

test("guest refresh confirmation can keep work or discard it without device saving", async ({
  page,
}, info) => {
  await page.goto("plan?mode=demo");
  await expect(
    page.getByRole("button", { name: "로그인하고 이어가기" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => {
      const event = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(event);
      return event.defaultPrevented;
    }),
  ).toBe(false);
  await page
    .getByLabel("반려견 1 이름", { exact: true })
    .fill("새로고침 전 두부");
  await page
    .getByRole("button", { name: "이 코스 검사하기", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "코스 확인 결과" }),
  ).toBeVisible();
  const first = page.waitForEvent("dialog").then(async (warning) => {
    expect(warning.type()).toBe("beforeunload");
    await warning.dismiss();
  });
  await Promise.all([first, page.evaluate(() => window.location.reload())]);
  await expect(page.getByLabel("반려견 1 이름", { exact: true })).toHaveValue(
    "새로고침 전 두부",
  );
  await expect(
    page.getByRole("heading", { name: "코스 확인 결과" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => ({
      local: localStorage.getItem("pawproof.trip.v1"),
      drafts: Object.keys(sessionStorage).filter((key) =>
        key.startsWith("pawproof.pending-note."),
      ),
    })),
  ).toEqual({ local: null, drafts: [] });
  const second = page.waitForEvent("dialog").then(async (warning) => {
    expect(warning.type()).toBe("beforeunload");
    await warning.accept();
  });
  await Promise.all([second, page.reload()]);
  await expect(page.getByLabel("반려견 1 이름", { exact: true })).toHaveValue(
    "두부",
  );
  await expect(
    page.getByRole("heading", { name: "코스 확인 결과" }),
  ).toHaveCount(0);
  await expect(page.getByLabel("장소 검색", { exact: true })).toBeEnabled();
  await page.screenshot({
    caret: "initial",
    path: info.outputPath("guest-notebook.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
