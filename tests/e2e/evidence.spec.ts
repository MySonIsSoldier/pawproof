import { test, expect } from "@playwright/test";

test("supplement sources preserve dates, contacts, raw text and official notice links", async ({
  page,
}) => {
  await page.route("**/api/verify", async (route) => {
    const response = await route.fetch();
    const result = await response.json();
    result.visits[0].policy.sources = [
      {
        label: "합성 보완 출처",
        url: "https://www.data.go.kr/data/15121775/fileData.do",
        publishedAt: "2026-01-19",
        accessedAt: "2026-09-11",
        phone: "032-000-0000",
        raw: "합성 원문: 실외 이용 가능",
      },
    ];
    result.visits[0].policy.notices = [
      {
        startDate: "2026-09-12",
        endDate: "2026-09-12",
        message: "합성 휴장",
        quote: "합성 휴장 안내",
        sourceLabel: "합성 공지 출처",
        checkedAt: "2026-09-11",
        sourceUrl:
          "https://reserve.insiseol.or.kr/bbs/bbsMsgDetail.do?bcd=notice&msg_seq=573",
      },
    ];
    await route.fulfill({ response, json: result });
  });
  await page.goto("plan?mode=demo");
  await page
    .getByRole("button", { name: "이 코스 검사하기", exact: true })
    .click();
  await page
    .getByRole("article", { name: "1번 방문지 초록숲 산책길" })
    .getByRole("button", { name: "근거 보기" })
    .click();
  const sources = page.getByRole("region", { name: "출처별 보완 자료" });
  await expect(sources).toContainText("2026-01-19");
  await expect(sources).toContainText("2026-09-11");
  await expect(sources.getByRole("link", { name: "전화하기" })).toHaveAttribute(
    "href",
    "tel:032-000-0000",
  );
  await sources.getByText("이 출처의 원문", { exact: true }).click();
  await expect(
    sources.getByText("합성 원문: 실외 이용 가능", { exact: true }),
  ).toBeVisible();
  await expect(
    sources.getByRole("link", { name: "휴장 공지 확인" }),
  ).toHaveAttribute("href", /msg_seq=573/);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
