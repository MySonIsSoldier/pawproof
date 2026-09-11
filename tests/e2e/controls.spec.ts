import { expect, test } from "@playwright/test";

test("custom controls preserve Korean dates, exact times and keyboard selection", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      /hydration|hydrated|aria-/i.test(message.text())
    )
      errors.push(message.text());
  });
  await page.goto("plan?mode=demo");
  await page
    .getByRole("button", { name: "이 기기에 저장", exact: true })
    .click();
  await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem("pawproof.trip.v1")!);
    saved.trip.date = "2026-12-31";
    saved.trip.startTime = "23:59";
    saved.trip.visits[0].duration = 75;
    localStorage.setItem("pawproof.trip.v1", JSON.stringify(saved));
  });
  await page.getByRole("button", { name: "불러오기", exact: true }).click();
  const date = page.getByRole("button", { name: "여행 날짜", exact: true });
  await expect(date).toHaveText("2026. 12. 31");
  await date.click();
  const calendar = page.getByRole("dialog", { name: "여행 날짜 선택" });
  await expect(calendar).toContainText("2026년 12월");
  await calendar.getByRole("button", { name: "다음 달" }).click();
  await expect(calendar).toContainText("2027년 1월");
  await page.screenshot({ path: info.outputPath("calendar.png") });
  await calendar.getByRole("button", { name: /2027년 1월 1일/ }).click();
  await expect(calendar).not.toBeVisible();
  await expect(date).toHaveText("2027. 01. 01");
  await expect(date).toBeFocused();

  const arrival = page.getByRole("button", {
    name: "첫 장소 도착",
    exact: true,
  });
  await expect(arrival).toContainText("23:59");
  await arrival.click();
  await page.getByRole("combobox", { name: "도착 시", exact: true }).click();
  await page.getByRole("option", { name: "00시", exact: true }).click();
  await page.getByRole("combobox", { name: "도착 분", exact: true }).click();
  await page.getByRole("option", { name: "07분", exact: true }).click();
  await page.getByRole("button", { name: "이 시간으로 적용" }).click();
  await expect(arrival).toContainText("00:07");
  await expect(arrival).toBeFocused();
  await arrival.click();
  await page.getByRole("combobox", { name: "도착 시", exact: true }).click();
  await page.getByRole("option", { name: "12시", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(arrival).toContainText("00:07");

  const duration = page.getByRole("combobox", {
    name: "초록숲 산책길 체류시간",
  });
  await expect(duration).toHaveText("75분");
  await duration.focus();
  await page.keyboard.press("Enter");
  await page.getByRole("option", { name: "90분", exact: true }).click();
  await expect(duration).toHaveText("90분");
  const zone = page.getByRole("combobox", { name: "초록숲 산책길 이용 구역" });
  await zone.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("option", { name: "실외", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Home");
  // Radix schedules list navigation focus; verify it before confirming the item.
  await expect(
    page.getByRole("option", { name: "실내", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(zone).toHaveText("실내");
  await expect(zone).toBeFocused();
  await expect(zone).toHaveCSS("outline-color", "rgb(47, 107, 80)");
  await page.getByLabel("반려견 1 이름").focus();
  await expect(page.getByLabel("반려견 1 이름")).toHaveCSS(
    "outline-color",
    "rgb(47, 107, 80)",
  );
  await page
    .getByRole("button", { name: "이 기기에 저장", exact: true })
    .click();
  const saved = await page.evaluate(
    () => JSON.parse(localStorage.getItem("pawproof.trip.v1")!).trip,
  );
  expect(saved.date).toBe("2027-01-01");
  expect(saved.startTime).toBe("00:07");
  expect(saved.visits[0]).toMatchObject({ duration: 90, zone: "indoor" });
  expect(
    await page.locator('input[type="date"], input[type="time"]').count(),
  ).toBe(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("custom controls stay disabled while a verification is pending", async ({
  page,
}) => {
  await page.goto("plan?mode=demo");
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/verify", async (route) => {
    await pending;
    await route.fulfill({
      status: 502,
      contentType: "application/json",
      body: JSON.stringify({ error: "검사 중단 테스트" }),
    });
  });
  try {
    await page
      .getByRole("button", { name: "이 코스 검사하기", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "여행 날짜", exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "첫 장소 도착", exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByRole("combobox", { name: "초록숲 산책길 체류시간" }),
    ).toBeDisabled();
  } finally {
    release();
  }
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "검사 중단 테스트",
  );
  await expect(
    page.getByRole("button", { name: "여행 날짜", exact: true }),
  ).toBeEnabled();
});

test("design system renders only in development", async ({ page }) => {
  const response = await page.goto("dev/design-system");
  if (process.env.E2E_MODE === "production") {
    expect(response?.status()).toBe(404);
    return;
  }
  await expect(
    page.getByRole("heading", { name: "숲빛 입력 컴포넌트" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "검사 중", exact: true }),
  ).toBeDisabled();
  const checkbox = page.getByRole("checkbox", { name: "목줄 준비" });
  await checkbox.uncheck();
  await expect(checkbox).not.toBeChecked();
  await page.getByRole("combobox", { name: "이용 구역" }).click();
  await expect(page.getByRole("option", { name: "선택 불가" })).toBeDisabled();
  await page.keyboard.press("Escape");
});
