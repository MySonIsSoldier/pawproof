import { test, expect } from "@playwright/test";

test("region selection survives category changes and food guidance preserves uncertainty", async ({
  page,
}) => {
  const queries: URL[] = [];
  await page.route("**/api/places?*", (route) => {
    queries.push(new URL(route.request().url()));
    return route.fulfill({
      json: {
        places: [
          {
            id: "99999",
            name: "합성 파주 카페",
            address: "경기도 파주시 합성로 1",
            category: "카페",
            source: "kto",
            lat: 37.7,
            lng: 126.7,
          },
        ],
      },
    });
  });
  await page.goto("plan?view=note");
  await expect(
    page.getByRole("button", { name: "합성 파주 카페 담기" }),
  ).toBeVisible();
  expect(queries.at(-1)?.searchParams.get("q")).toBe("경기 북서부");
  await page
    .getByRole("button", { name: "왜 경기 북서부부터 시작하나요?" })
    .click();
  await expect(page.getByText(/경기도 주민의 양육률을 뜻하지는/)).toBeVisible();
  await page
    .getByRole("group", { name: "지역 바로 찾기" })
    .getByRole("button", { name: "파주", exact: true })
    .click();
  await expect(page.getByLabel("장소 검색")).toHaveValue("파주");
  await expect(
    page.getByRole("button", { name: "카페", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "카페", exact: true }).click();
  await expect
    .poll(() => queries.at(-1)?.searchParams.get("category"))
    .toBe("카페");
  expect(queries.at(-1)?.searchParams.get("q")).toBe("파주");
  await page.getByRole("button", { name: "합성 파주 카페 담기" }).click();
  const guide = page.getByRole("region", {
    name: "음식점 방문 전 공식 정보 확인",
  });
  await guide.getByRole("button").click();
  await expect(
    guide.getByText("경기도 파주시 합성로 1", { exact: false }),
  ).toBeVisible();
  await expect(
    guide.getByRole("link", { name: /식약처 동반출입 음식점 목록/ }),
  ).toHaveAttribute(
    "href",
    "https://www.foodsafetykorea.go.kr/portal/petKorea.do",
  );
  await expect(
    guide.getByText(/목록 등재를 자동 확인한 결과가 아니에요/),
  ).toBeVisible();
  await expect(guide.getByText(/수기대장·QR/)).toBeVisible();
  await expect(guide.getByText(/‘확인 필요’를 해제하지 않아요/)).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
