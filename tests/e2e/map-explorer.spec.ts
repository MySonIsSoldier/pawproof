import { test, expect } from "@playwright/test";
import { fakeKakaoSdk } from "../fixtures/kakao-sdk";
import { demoPolicy } from "../../src/infrastructure/demo/catalog";
const places = [0, 1, 2].map((i) => ({
  id: String(9001 + i),
  name: `지도 테스트 장소 ${i + 1}`,
  category: "카페",
  address: "경기도 고양시 합성로 1",
  lat: 37.65 + i * 0.001,
  lng: 126.77,
  source: "kto",
}));

test("map filters, precise uncertainty, inquiry and notebook share the same guest trip", async ({
  page,
}, info) => {
  let searches = 0,
    inspections = 0;
  await page.route("https://dapi.kakao.com/**", (route) =>
    route.fulfill({ contentType: "text/javascript", body: fakeKakaoSdk }),
  );
  await page.route("**/api/discovery/nearby?*", (route) => {
    searches++;
    return route.fulfill({ json: { places } });
  });
  await page.route("**/api/places?*", (route) =>
    route.fulfill({ json: { places } }),
  );
  await page.route("**/api/discovery/inspect", (route) => {
    inspections++;
    const ids = route.request().postDataJSON().ids;
    return route.fulfill({
      json: {
        checks: places
          .filter((p) => ids.includes(p.id))
          .map((place, i) => {
            const policy = demoPolicy(i === 0 ? "demo-table" : "demo-park");
            if (i === 2)
              policy.rules = policy.rules.filter((r) => r.kind !== "weight");
            return { place, policy, phone: "031-123-4567" };
          }),
        failedIds: [],
      },
    });
  });
  await page.goto("plan");
  const explorer = page.getByRole("region", {
    name: "지도에서 장소 찾기",
    exact: true,
  });
  await expect(
    explorer.getByRole("button", {
      name: "지도 테스트 장소 1 지도에서 선택",
      exact: true,
    }),
  ).toBeVisible();
  await explorer.getByRole("button", { name: "반려견 조건 입력" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("반려견 1 이름").fill("두부");
  await dialog.getByLabel("반려견 1 견종").fill("푸들");
  await dialog.getByLabel("반려견 1 체중").fill("12");
  await dialog.getByRole("checkbox", { name: "목줄", exact: true }).check();
  await dialog.getByRole("button", { name: "조건 적용하고 지도 보기" }).click();
  await explorer.getByRole("button", { name: "가까운 3곳 조건 확인" }).click();
  await expect(
    explorer.getByRole("button", { name: "현재 후보 조회 완료" }),
  ).toBeVisible();
  await explorer
    .getByRole("checkbox", { name: "우리 조건과 불일치하는 곳 제외" })
    .check();
  await expect(explorer.locator(".explore-result")).toHaveCount(2);
  await explorer
    .getByRole("checkbox", { name: "조건이 확인된 곳만 보기" })
    .check();
  await expect(explorer.locator(".explore-result")).toHaveCount(1);
  expect(inspections).toBe(1);
  await explorer
    .getByRole("checkbox", { name: "조건이 확인된 곳만 보기" })
    .uncheck();
  await explorer
    .locator(".explore-result")
    .filter({ hasText: "지도 테스트 장소 3" })
    .click();
  await expect(
    explorer.getByText("체중 제한 정보가 없어 확인이 필요해요."),
  ).toBeVisible();
  await expect(
    explorer.getByRole("heading", { name: "여기까지 확인했어요" }),
  ).toBeVisible();
  await expect(
    explorer.getByRole("link", { name: /전화하기/ }),
  ).toHaveAttribute("href", "tel:0311234567");
  await expect(
    explorer.getByRole("link", { name: /카카오맵에서 상호/ }),
  ).toHaveAttribute("href", /map\.kakao\.com\/link\/search\//);
  await explorer.getByRole("button", { name: "이렇게 문의해 보세요" }).click();
  await expect(explorer.locator(".inquiry-copy")).toContainText("12kg");
  await explorer
    .getByRole("button", { name: "코스에 담기", exact: true })
    .click();
  await explorer.getByRole("button", { name: "여행 노트 1곳 보기 →" }).click();
  await expect(
    page.getByRole("article", { name: /지도 테스트 장소 3/ }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "지도에서 찾기", exact: true })
    .click();
  await expect(
    explorer.getByRole("button", { name: "코스에 담았어요" }),
  ).toBeDisabled();
  await explorer.getByRole("button", { name: "← 장소 목록" }).click();
  const beforePan = searches;
  await page.getByRole("button", { name: "테스트 지도 이동" }).click();
  await expect(
    page.getByRole("button", { name: "이 지역 다시 검색" }),
  ).toBeEnabled();
  expect(searches).toBe(beforePan);
  await page.getByRole("button", { name: "이 지역 다시 검색" }).click();
  await expect.poll(() => searches).toBe(beforePan + 1);
  expect(inspections).toBe(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: info.outputPath("map.png"), fullPage: true });
});

test("SDK failure and location denial retain the list and destination search is explicit", async ({
  page,
}) => {
  await page.route("https://dapi.kakao.com/**", (route) => route.abort());
  await page.route("**/api/discovery/nearby?*", (route) =>
    route.fulfill({ json: { places } }),
  );
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "geolocation", {
      value: {
        getCurrentPosition: (_ok: unknown, fail: (value: unknown) => void) =>
          fail({ code: 1 }),
      },
    });
  });
  await page.goto("plan");
  await expect(
    page.getByText("지도를 표시하지 못했어요", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".explore-result")).toHaveCount(3);
  await page.getByRole("button", { name: "◎ 내 주변" }).click();
  await expect(page.getByText(/현재 위치를 가져오지 못했어요/)).toBeVisible();
  await page.unroute("https://dapi.kakao.com/**");
  await page.route("https://dapi.kakao.com/**", (route) =>
    route.fulfill({ contentType: "text/javascript", body: fakeKakaoSdk }),
  );
  await page.getByRole("button", { name: "지도 다시 불러오기" }).click();
  await page.getByLabel("여행지 또는 주소 검색").fill("부산");
  await page.getByRole("button", { name: "찾기", exact: true }).click();
  await page
    .getByRole("list", { name: "여행지 검색 결과" })
    .getByRole("button")
    .click();
  await expect(page.locator(".explore-panel-heading")).toContainText(
    "부산 해운대구",
  );
});
