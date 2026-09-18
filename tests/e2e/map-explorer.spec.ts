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
          .map((place) => {
            const index = Number(place.id) - 9001;
            const policy = demoPolicy(index === 0 ? "demo-table" : "demo-park");
            if (index === 2)
              policy.rules = policy.rules.filter((r) => r.kind !== "weight");
            return { place, policy, phone: "031-123-4567" };
          }),
        failedIds: [],
      },
    });
  });
  await page.goto("plan");
  const explorer = page;
  await expect(
    explorer.getByRole("button", {
      name: "지도 테스트 장소 1 지도에서 선택",
      exact: true,
    }),
  ).toBeVisible();
  if (info.project.name === "mobile")
    await explorer.getByRole("button", { name: "검색", exact: true }).click();
  await explorer.getByRole("button", { name: /반려견 조건/ }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("반려견 1 이름").fill("두부");
  await dialog.getByLabel("반려견 1 견종").fill("푸들");
  await dialog.getByLabel("반려견 1 체중").fill("12");
  await dialog.getByRole("checkbox", { name: "목줄", exact: true }).check();
  await dialog.getByRole("button", { name: "조건 적용하고 지도 보기" }).click();
  if (info.project.name === "mobile") {
    await page.getByRole("button", { name: "패널 닫기" }).click();
    await page.getByRole("button", { name: "목록 3곳", exact: true }).click();
  }
  await explorer
    .locator(".explore-result")
    .filter({ hasText: "지도 테스트 장소 3" })
    .click();
  if (info.project.name === "desktop")
    await expect(explorer.getByText("조건을 확인하고 있어요…")).toBeVisible();
  await expect(
    explorer.getByText("체중 제한 정보가 없어 확인이 필요해요."),
  ).toBeVisible();
  expect(inspections).toBe(1);
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
  await explorer
    .getByRole("button", {
      name:
        info.project.name === "mobile"
          ? "완료 · 1곳"
          : "완료 · 여행 노트 1곳 보기",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("article", { name: /지도 테스트 장소 3/ }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "지도에서 찾기", exact: true })
    .click();
  if (info.project.name === "mobile")
    await page
      .getByRole("button", {
        name: "지도 테스트 장소 3 지도에서 선택",
        exact: true,
      })
      .click();
  await expect(
    explorer.getByRole("button", { name: "코스에 담았어요" }),
  ).toBeDisabled();
  await explorer.getByRole("button", { name: "← 장소 목록" }).click();
  if (info.project.name === "mobile")
    await page
      .getByRole("dialog", { name: "주변 장소 목록" })
      .getByRole("button", { name: "패널 닫기" })
      .click();
  const beforePan = searches;
  await page.getByRole("button", { name: "테스트 지도 이동" }).click();
  await expect(
    page.getByRole("button", { name: "이 지역 다시 검색" }),
  ).toBeEnabled();
  expect(searches).toBe(beforePan);
  if (info.project.name === "desktop") {
    const searchButton = page.getByRole("button", {
      name: "이 지역 다시 검색",
    });
    const before = await searchButton.boundingBox();
    await searchButton.hover();
    await expect(searchButton).toHaveCSS(
      "transform",
      "matrix(1, 0, 0, 1, 0, -2)",
    );
    await expect
      .poll(async () => (await searchButton.boundingBox())!.x)
      .toBeCloseTo(before!.x, 0);
  }
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
}, info) => {
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
  if (info.project.name === "mobile")
    await page.getByRole("button", { name: "목록 3곳", exact: true }).click();
  await expect(page.locator(".explore-result")).toHaveCount(3);
  if (info.project.name === "mobile")
    await page.getByRole("button", { name: "검색", exact: true }).click();
  await page.getByRole("button", { name: "◎ 내 주변" }).click();
  await expect(
    info.project.name === "mobile"
      ? page.getByRole("dialog", { name: "지도 검색·필터" }).getByRole("status")
      : page.getByText(/현재 위치를 가져오지 못했어요/),
  ).toBeVisible();
  await page.unroute("https://dapi.kakao.com/**");
  await page.route("https://dapi.kakao.com/**", (route) =>
    route.fulfill({ contentType: "text/javascript", body: fakeKakaoSdk }),
  );
  if (info.project.name === "mobile")
    await page
      .getByRole("dialog", { name: "지도 검색·필터" })
      .getByRole("button", { name: "패널 닫기" })
      .click();
  if (info.project.name === "mobile")
    await page
      .getByRole("dialog", { name: "주변 장소 목록" })
      .getByRole("button", { name: "패널 닫기" })
      .click();
  await page.getByRole("button", { name: "지도 다시 불러오기" }).click();
  if (info.project.name === "mobile")
    await page.getByRole("button", { name: "검색", exact: true }).click();
  const destinationSearch =
    info.project.name === "mobile"
      ? page
          .getByRole("dialog", { name: "지도 검색·필터" })
          .getByLabel("여행지 또는 주소 검색")
      : page.getByLabel("여행지 또는 주소 검색");
  await destinationSearch.fill("부산");
  await page.getByRole("button", { name: "찾기", exact: true }).click();
  await page
    .getByRole("list", { name: "여행지 검색 결과" })
    .getByRole("button")
    .click();
  if (info.project.name === "mobile")
    await page.getByRole("button", { name: "목록 3곳", exact: true }).click();
  await expect(page.locator(".explore-panel-heading")).toContainText(
    "부산 해운대구",
  );
});

test("grouped places can all be inspected and added without leaving the map", async ({
  page,
}, info) => {
  const nearby = places.map((p, i) => ({ ...p, lat: 37.65 + i * 0.0001 }));
  await page.route("https://dapi.kakao.com/**", (route) =>
    route.fulfill({ contentType: "text/javascript", body: fakeKakaoSdk }),
  );
  await page.route("**/api/discovery/nearby?*", (route) =>
    route.fulfill({
      json: {
        places:
          new URL(route.request().url()).searchParams.get("category") === "식당"
            ? []
            : nearby,
      },
    }),
  );
  await page.goto("plan");
  const mobile = info.project.name === "mobile";
  await expect(page.getByRole("link", { name: "PawProof 소개" })).toHaveCount(
    0,
  );
  if (mobile) await page.getByRole("button", { name: "검색", exact: true }).click();
  const radius = page.getByRole("combobox", { name: "검색 반경" });
  await radius.click();
  await page.getByRole("option", { name: "10km", exact: true }).click();
  await expect(radius).toContainText("10km");
  if (mobile) await page.getByRole("button", { name: "패널 닫기" }).click();
  const group = page.getByRole("button", { name: "겹친 장소 3곳 모두 보기" });
  await group.click();
  await expect(page.locator(".explore-result")).toHaveCount(3);
  if (mobile) {
    const mapHeight = await page
      .locator(".explore-map")
      .evaluate((el) => el.getBoundingClientRect().height);
    expect(mapHeight).toBeGreaterThan(450);
    await expect(
      page.getByRole("dialog", { name: "겹친 장소 3곳" }),
    ).toBeVisible();
    await page.getByRole("dialog", { name: "겹친 장소 3곳" }).press("Escape");
    await expect(
      page.getByRole("button", { name: "목록 3곳", exact: true }),
    ).toBeFocused();
    const mapBounds = await page.locator(".explore-map").boundingBox();
    const navBounds = await page
      .getByRole("navigation", { name: "여행 작업 화면" })
      .boundingBox();
    expect(mapBounds!.y + mapBounds!.height).toBeLessThan(navBounds!.y);
  }
  // Zooming separates nearby candidates; it never drops a member.
  for (let i = 0; i < 4; i++)
    await page.getByRole("button", { name: "지도 확대", exact: true }).click();
  await expect(group).toHaveCount(0);
  for (let i = 0; i < 3; i++) {
    await page
      .getByRole("button", {
        name: `${places[i].name} 지도에서 선택`,
        exact: true,
      })
      .click();
    await expect(
      page.getByRole("article", { name: `${places[i].name} 상세` }),
    ).toContainText(places[i].address);
    await page
      .getByRole("button", { name: "코스에 담기", exact: true })
      .click();
    await expect(
      page.getByRole("region", { name: "지도에서 장소 찾기", exact: true }),
    ).toBeVisible();
    if (mobile) await expect(page.getByRole("dialog")).toHaveCount(0);
  }
  await expect(page.locator(".map-pin.in-route")).toHaveCount(3);
  const line = page.locator(".explore-map [data-test-route]");
  await expect(line).toHaveCount(1);
  expect(JSON.parse((await line.getAttribute("data-test-route"))!)).toEqual(
    nearby.map((p) => ({ lat: p.lat, lng: p.lng })),
  );
  await page.getByRole("button", { name: "코스 전체", exact: true }).click();
  await expect(page.locator(".kakao-map-canvas")).toHaveAttribute(
    "data-bounds",
    /37.6502/,
  );
  await page.screenshot({
    path: `test-results/map-${info.project.name}.png`,
    fullPage: true,
  });
  await page
    .getByRole("button", {
      name: mobile ? "완료 · 3곳" : "완료 · 여행 노트 3곳 보기",
      exact: true,
    })
    .click();
  await expect(page.locator(".visit-card")).toHaveCount(3);
  await page
    .getByRole("button", { name: `${places[2].name} 위로`, exact: true })
    .click();
  await page
    .getByRole("button", { name: `${places[0].name} 삭제`, exact: true })
    .click();
  await page
    .getByRole("button", { name: "지도에서 찾기", exact: true })
    .click();
  await expect(page.locator(".map-pin.in-route")).toHaveCount(2);
  expect(JSON.parse((await line.getAttribute("data-test-route"))!)).toEqual(
    [nearby[2], nearby[1]].map((p) => ({ lat: p.lat, lng: p.lng })),
  );
  // Filtering out candidates must not erase already selected route stops.
  if (mobile) await page.getByRole("button", { name: "검색", exact: true }).click();
  await page
    .getByRole("group", { name: "지도 장소 유형" })
    .getByRole("button", { name: "식당", exact: true })
    .click();
  await expect(line).toHaveCount(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("map route removes a middle stop and starts a new note", async ({
  page,
}, info) => {
  const nearby = places.map((p, i) => ({ ...p, lat: 37.65 + i * 0.001 }));
  await page.route("https://dapi.kakao.com/**", (route) =>
    route.fulfill({ contentType: "text/javascript", body: fakeKakaoSdk }),
  );
  await page.route("**/api/discovery/nearby?*", (route) =>
    route.fulfill({ json: { places: nearby } }),
  );
  await page.goto("plan");
  const mobile = info.project.name === "mobile";
  for (let i = 0; i < 4; i++)
    await page.getByRole("button", { name: "지도 확대", exact: true }).click();
  for (const place of places) {
    await page
      .getByRole("button", { name: `${place.name} 지도에서 선택`, exact: true })
      .click();
    await page.getByRole("button", { name: "코스에 담기", exact: true }).click();
  }
  await expect(page.locator(".map-route-list li")).toHaveCount(3);
  await page
    .getByRole("button", {
      name: `${places[1].name} 코스에서 빼기`,
      exact: true,
    })
    .click();
  await expect(page.locator(".map-route-list li")).toHaveCount(2);
  const stops = page.locator(".map-route-stop");
  await expect(stops).toHaveCount(2);
  await expect(stops.nth(0)).toContainText(places[0].name);
  await expect(stops.nth(1)).toContainText(places[2].name);
  const line = page.locator(".explore-map [data-test-route]");
  expect(JSON.parse((await line.getAttribute("data-test-route"))!)).toEqual(
    [nearby[0], nearby[2]].map((p) => ({ lat: p.lat, lng: p.lng })),
  );
  await page
    .getByRole("button", { name: mobile ? "새 노트" : "새 여행 노트", exact: true })
    .click();
  await expect(page.locator(".map-route-list")).toHaveCount(0);
  await expect(
    page.getByRole("button", {
      name: mobile ? "완료 · 0곳" : "완료 · 여행 노트 0곳 보기",
      exact: true,
    }),
  ).toBeVisible();
});

test("identical coordinates keep every place accessible at maximum zoom", async ({
  page,
}, info) => {
  const overlapping = places.map((p) => ({ ...p, lat: places[0].lat }));
  await page.route("https://dapi.kakao.com/**", (route) =>
    route.fulfill({ contentType: "text/javascript", body: fakeKakaoSdk }),
  );
  await page.route("**/api/discovery/nearby?*", (route) =>
    route.fulfill({ json: { places: overlapping } }),
  );
  await page.goto("plan");
  for (let i = 0; i < 7; i++)
    await page.getByRole("button", { name: "지도 확대", exact: true }).click();
  for (let i = 0; i < 3; i++) {
    await page.getByRole("button", { name: "겹친 장소 3곳 모두 보기" }).click();
    await page
      .locator(".explore-result")
      .filter({ hasText: places[i].name })
      .click();
    await page
      .getByRole("button", { name: "코스에 담기", exact: true })
      .click();
    if (info.project.name === "mobile")
      await expect(page.getByRole("dialog")).toHaveCount(0);
  }
  await expect(
    page.getByRole("button", { name: "여행 노트 · 3곳", exact: true }),
  ).toBeVisible();
});
