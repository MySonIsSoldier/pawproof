import { expect, test } from "@playwright/test";

test("contact page exposes an accessible form and footer entry point", async ({
  page,
}) => {
  await page.goto("contact");
  await expect(
    page.getByRole("heading", { name: /작은 목소리/u }),
  ).toBeVisible();
  await expect(page.getByLabel("답변받을 이메일")).toBeVisible();
  await expect(page.getByLabel("문의 유형")).toBeVisible();
  await expect(page.getByLabel("문의 내용")).toBeVisible();
  await expect(
    page.getByRole("contentinfo").getByRole("link", { name: /문의하기/u }),
  ).toHaveAttribute("href", /\/contact$/u);
});
test("contact form posts through the app API and shows delivery success", async ({
  page,
}) => {
  await page.route("**/api/contact", (route) =>
    route.fulfill({
      status: 202,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    }),
  );
  await page.goto("contact");
  await page.getByLabel("답변받을 이메일").fill("traveler@example.com");
  await page.getByLabel("문의 유형").selectOption("data");
  await page
    .getByLabel("문의 내용")
    .fill("파주 장소 정보의 최신 동반 조건을 확인하고 싶어요.");
  await page.getByRole("button", { name: "문의 보내기" }).click();
  await expect(page.getByRole("heading", { name: "문의가 잘 도착했어요." })).toBeVisible();
  await expect(page.getByText(/답변드릴게요/u)).toBeVisible();
});

test("contact API rejects malformed public input without provider access", async ({
  request,
}) => {
  const response = await request.post("api/contact", {
    data: {
      email: "not-an-email",
      category: "data",
      message: "short",
    },
  });
  expect(response.status()).toBe(400);
  await expect(response.json()).resolves.toMatchObject({
    code: "INVALID_INPUT",
  });
});
