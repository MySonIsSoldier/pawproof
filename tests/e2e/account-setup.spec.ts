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
      "계정 연결을 준비하고 있어요. 코스 검사는 계속 이용할 수 있지만, 지금은 여행 노트를 저장할 수 없어요.",
    ),
  ).toBeVisible();
  await expect(dialog.getByRole("textbox")).toHaveCount(0);
  await page.getByRole("button", { name: "계정 안내 닫기" }).click();
  await page.getByRole("link", { name: "가상 코스로 체험하기" }).click();
  await expect(
    page.getByRole("button", { name: "로그인하고 이어가기", exact: true }),
  ).toBeVisible();
  expect((await request.get("./api/account/trips")).status()).toBe(401);
});
