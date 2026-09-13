import { test, expect } from "@playwright/test";

test("Korean landing, working CTA, FAQ, local font and responsive screenshot", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("./");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "우리 강아지와",
  );
  await page.evaluate(() => document.fonts.ready);
  expect(await page.locator("html").getAttribute("lang")).toBe("ko");
  await expect(
    page.getByRole("img", {
      name: "노란 꽃을 물고 야외에 앉아 있는 골든리트리버",
    }),
  ).toBeVisible();
  await page
    .getByText("가상 체험 코스는 실제 여행에 써도 되나요?", { exact: true })
    .click();
  await expect(
    page.getByText(/기능을 설명하기 위해 직접 만든 예시/),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: info.outputPath("home.png"), fullPage: true });
  await page.getByRole("link", { name: "가상 코스로 체험하기" }).click();
  await expect(
    page.getByRole("heading", { name: "우리의 여행 노트" }),
  ).toBeVisible();
  await expect(
    page.getByText("가상 체험 코스예요.", { exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("complete trip: four states, evidence, stale inputs, replacement, undo, preparation and saved inputs", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("plan?mode=demo");
  const verify = page.getByRole("button", {
    name: "이 코스 검사하기",
    exact: true,
  });
  await verify.click();
  const restaurant = page.getByRole("article", {
    name: "2번 방문지 소담한 식탁",
  });
  await expect(
    restaurant.getByText("이용 불가", { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("article", { name: "1번 방문지 초록숲 산책길" })
      .getByText("이용 가능", { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("article", { name: "3번 방문지 느린 오후" })
      .getByText("준비 필요", { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("article", { name: "4번 방문지 물빛 호수공원" })
      .getByText("확인 필요", { exact: true }),
  ).toBeVisible();
  await restaurant.getByRole("button", { name: "근거 보기" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(
    dialog.locator("blockquote").filter({ hasText: "10kg 이하" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(
    restaurant.getByRole("button", { name: "근거 보기" }),
  ).toBeFocused();
  await page.getByLabel("반려견 1 체중").fill("8");
  await expect(page.getByRole("status")).toHaveText(
    "입력이 변경되었어요. 다시 검사해 주세요.",
  );
  await expect(
    restaurant.getByRole("button", { name: "대체 장소 찾기" }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "코스 다시 검사하기", exact: true })
    .click();
  await expect(
    restaurant.getByText("이용 가능", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("반려견 1 체중").fill("12");
  await page
    .getByRole("button", { name: "코스 다시 검사하기", exact: true })
    .click();
  await expect(
    restaurant.getByText("이용 불가", { exact: true }),
  ).toBeVisible();
  await restaurant.getByRole("button", { name: "대체 장소 찾기" }).click();
  const alternatives = page.getByRole("region", { name: "대체 장소 비교" });
  await expect(
    alternatives.getByRole("heading", { name: "이런 곳은 어떨까요?" }),
  ).toBeVisible();
  await alternatives
    .getByRole("button", { name: "이 장소로 교체" })
    .first()
    .click();
  await expect(restaurant).not.toBeVisible();
  await expect(
    page.getByText(/바꾸고 이후 일정까지 다시 검사했어요/),
  ).toBeVisible();
  await page.getByRole("button", { name: "교체 전 코스로 되돌리기" }).click();
  await expect(restaurant).toBeVisible();
  await page.getByLabel("유모차", { exact: true }).check();
  await page
    .getByRole("button", { name: "코스 다시 검사하기", exact: true })
    .click();
  await expect(
    page
      .getByRole("article", { name: "3번 방문지 느린 오후" })
      .getByText("이용 가능", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "출발 전, 챙겨주세요." }),
  ).toBeVisible();
  await page
    .locator(".prep-block")
    .getByRole("button", { name: "물빛 호수공원", exact: true })
    .click();
  await expect(
    page.locator(".ui-accordion-content .question-text"),
  ).toContainText("마릿수");
  await page
    .getByRole("button", { name: "물빛 호수공원", exact: true })
    .click();
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".print-question .question-text")).toBeVisible();
  await expect(page.locator(".print-question .question-text")).toContainText(
    "마릿수",
  );
  await expect(page.locator(".print-summary")).toContainText("12kg");
  await expect(page.locator(".print-summary")).toBeVisible();
  await expect(page.locator(".mobile-check-bar")).not.toBeVisible();
  await page.emulateMedia({ media: "screen" });
  await page.screenshot({
    path: info.outputPath("trip-result.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByLabel("반려견 1 이름").fill("콩이");
  await page
    .getByRole("button", { name: "이 기기에 저장", exact: true })
    .click();
  const stored = await page.evaluate(() =>
    localStorage.getItem("pawproof.trip.v1"),
  );
  expect(stored).toContain("콩이");
  expect(stored).not.toContain('"raw"');
  expect(stored).not.toContain('"rules"');
  await page.reload();
  await page.getByRole("button", { name: "불러오기", exact: true }).click();
  await expect(page.getByLabel("반려견 1 이름")).toHaveValue("콩이");
  await expect(
    page.getByRole("heading", { name: "코스 확인 결과" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "저장 삭제", exact: true }).click();
  expect(
    await page.evaluate(() => localStorage.getItem("pawproof.trip.v1")),
  ).toBeNull();
  expect(errors).toEqual([]);
});

test("editing pets, search, visit capacity, ordering, lock and validation", async ({
  page,
}) => {
  await page.goto("plan?mode=demo");
  await page.getByRole("button", { name: "함께 가는 반려견 추가" }).click();
  await page
    .getByRole("button", { name: "이 코스 검사하기", exact: true })
    .click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "반려견의 이름",
  );
  await page.getByRole("button", { name: "반려견 2 삭제" }).click();
  await page
    .getByRole("article", { name: "2번 방문지 소담한 식탁" })
    .getByLabel("꼭 유지")
    .check();
  await expect(
    page.getByRole("button", { name: "소담한 식탁 삭제" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "초록숲 산책길 아래로" }).click();
  await expect(
    page.getByText("꼭 유지할 방문지의 순서는 바꿀 수 없어요."),
  ).toBeVisible();
  await page
    .getByRole("article", { name: "2번 방문지 소담한 식탁" })
    .getByLabel("꼭 유지")
    .uncheck();
  await page.getByRole("button", { name: "초록숲 산책길 아래로" }).click();
  await expect(
    page.getByRole("article", { name: "1번 방문지 소담한 식탁" }),
  ).toBeVisible();
  await page.getByLabel("장소 검색", { exact: true }).fill("마당");
  await page.getByRole("button", { name: "검색", exact: true }).click();
  await page.getByRole("button", { name: "마당 있는 식탁 담기" }).click();
  await expect(
    page.getByRole("article", { name: "5번 방문지 마당 있는 식탁" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "마당 있는 식탁 담기" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "마당 있는 식탁 삭제" }).click();
  await page.getByLabel("장소 검색", { exact: true }).fill("없는장소");
  await page.getByRole("button", { name: "검색", exact: true }).click();
  await expect(page.getByText(/검색 결과가 없어요/)).toBeVisible();
});

test("live setup errors are explicit, invalid requests rejected and network failure recoverable", async ({
  page,
  request,
  baseURL,
}) => {
  await page.goto("plan");
  await page.getByLabel("장소 검색", { exact: true }).fill("인천");
  await page.getByRole("button", { name: "검색", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "실제 장소 연결을 준비 중",
  );
  const invalid = await request.post(new URL("api/verify", baseURL).href, {
    data: { mode: "live" },
  });
  expect(invalid.status()).toBe(400);
  await page.getByRole("button", { name: "가상 체험", exact: true }).click();
  await page.route("**/api/verify", (route) =>
    route.fulfill({
      status: 502,
      contentType: "application/json",
      body: JSON.stringify({ error: "외부 정보를 불러오지 못했어요." }),
    }),
  );
  await page
    .getByRole("button", { name: "이 코스 검사하기", exact: true })
    .click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "외부 정보를 불러오지 못했어요",
  );
  await expect(
    page.getByRole("button", { name: "이 코스 검사하기", exact: true }),
  ).toBeEnabled();
  await page.unroute("**/api/verify");
  await page
    .getByRole("button", { name: "이 코스 검사하기", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "코스 확인 결과" }),
  ).toBeVisible();
});
