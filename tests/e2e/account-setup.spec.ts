import { test, expect } from "@playwright/test";

test("missing Firebase configuration preserves guest flow and private API requires authentication", async ({
  page,
  request,
}) => {
  await page.goto("./");
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(
    dialog.getByText(
      "계정 연결을 준비하고 있어요. 지금은 ‘이 기기에 저장’을 이용해 주세요.",
    ),
  ).toBeVisible();
  await expect(dialog.getByRole("textbox")).toHaveCount(0);
  await page.getByRole("button", { name: "계정 안내 닫기" }).click();
  await page.getByRole("link", { name: "가상 코스로 체험하기" }).click();
  await expect(
    page.getByRole("button", { name: "이 기기에 저장", exact: true }),
  ).toBeVisible();
  expect((await request.get("./api/account/trips")).status()).toBe(401);
});
