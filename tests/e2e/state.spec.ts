import { test, expect } from "@playwright/test";

test("request state avoids duplicate verification and retries; mode reset isolates edits", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      /hydration|hydrated|infinite|maximum update/i.test(message.text())
    )
      errors.push(message.text());
  });
  await page.goto("plan?mode=demo");
  let calls = 0;
  await page.route("**/api/verify", async (route) => {
    calls++;
    await route.fulfill({
      status: 502,
      contentType: "application/json",
      body: JSON.stringify({ error: "재시도는 직접 선택해 주세요." }),
    });
  });
  await page
    .getByRole("button", { name: "이 코스 검사하기", exact: true })
    .evaluate((element: HTMLButtonElement) => {
      element.click();
      element.click();
    });
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "재시도는 직접",
  );
  expect(calls).toBe(1);
  await page
    .getByRole("button", { name: "이 코스 검사하기", exact: true })
    .click();
  await expect.poll(() => calls).toBe(2);
  await expect(
    page.getByRole("button", { name: "이 코스 검사하기", exact: true }),
  ).toBeEnabled();
  await page.getByLabel("반려견 1 이름").fill("편집한 이름");
  await page.getByRole("button", { name: "실제 장소", exact: true }).click();
  await expect(page.getByLabel("반려견 1 이름")).toBeEmpty();
  await page.getByRole("button", { name: "가상 체험", exact: true }).click();
  await expect(page.getByLabel("반려견 1 이름")).toHaveValue("두부");
  expect(
    await page.evaluate(() => localStorage.getItem("pawproof.trip.v1")),
  ).toBeNull();
  expect(errors).toEqual([]);
});
