/** One paid verification; no network mocks, source-text files, or credential logging. */
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
const require = createRequire(import.meta.url);
const { chromium, expect } = require("@playwright/test");
const browser = await chromium.launch({ headless: true });
const report = { checkedAt: new Date().toISOString(), success: false };
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
  });
  page.setDefaultTimeout(20000);
  const errors = [];
  page.on("pageerror", () => errors.push("Browser exception"));
  let posts = 0;
  await page.route("**/api/**", async (route) => {
    if (route.request().method() === "POST" && ++posts > 1)
      throw new Error("Live POST budget exceeded");
    await route.continue();
  });
  await page.goto("http://localhost:3000/absproxy/3000/plan");
  await page.getByLabel("반려견 1 이름").fill("인천 검증견");
  await page.getByLabel("반려견 1 견종").fill("골든리트리버");
  await page.getByLabel("반려견 1 체중").fill("12");
  await page.getByRole("button", { name: "여행 날짜", exact: true }).click();
  await page
    .getByRole("dialog", { name: "여행 날짜 선택" })
    .getByRole("button", { name: /2026년 9월 12일/ })
    .click();
  await page.getByLabel("장소 검색", { exact: true }).fill("인천");
  const searched = page.waitForResponse((r) =>
    new URL(r.url()).pathname.endsWith("/api/places"),
  );
  await page.getByRole("button", { name: "검색", exact: true }).click();
  const search = await (await searched).json();
  expect(search.places.length).toBeGreaterThan(20);
  report.searchCount = search.places.length;
  expect(search.places.find((p) => p.id === "2603720").category).toBe("카페");
  const names = ["누닝 펫푸드카페", "개떼놀이터 인천점", "송도 도그파크"];
  for (const name of names)
    await page
      .getByRole("button", { name: name + " 담기", exact: true })
      .click();
  const pending = page.waitForResponse(
    (r) => new URL(r.url()).pathname.endsWith("/api/verify"),
    { timeout: 240000 },
  );
  await page
    .getByRole("button", { name: "이 코스 검사하기", exact: true })
    .click();
  const response = await pending;
  expect(response.ok()).toBe(true);
  const result = await response.json();
  expect(result.mode).toBe("live");
  expect(result.travelBasis).toBe("kakao");
  expect(result.visits[2].status).toBe("blocked");
  expect(
    result.visits[2].findings.some((f) => f.message.includes("9월 12일 휴장")),
  ).toBe(true);
  for (const visit of result.visits)
    expect(visit.policy.sources.length).toBe(2);
  expect(result.visits[1].policy.rules.some((r) => r.conflict)).toBe(true);
  report.visits = result.visits.map((v) => ({
    id: v.place.id,
    status: v.status,
    sources: v.policy.sources.length,
    conflicts: v.policy.rules.filter((r) => r.conflict).length,
    notices: v.policy.notices.length,
  }));
  await expect(
    page.getByRole("heading", { name: "코스 확인 결과" }),
  ).toBeVisible();
  const park = page.getByRole("article", { name: "3번 방문지 " + names[2] });
  await park.getByRole("button", { name: "근거 보기" }).click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("link", { name: "휴장 공지 확인" }),
  ).toHaveAttribute("href", /msg_seq=573/);
  await expect(
    dialog.getByRole("region", { name: "출처별 보완 자료" }),
  ).toContainText("2026-01-19");
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 390, height: 844 });
  await park.getByRole("button", { name: "근거 보기" }).click();
  await expect(
    page.getByRole("region", { name: "출처별 보완 자료" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "이 기기에 저장", exact: true })
    .click();
  const stored = await page.evaluate(() =>
    localStorage.getItem("pawproof.trip.v1"),
  );
  expect(stored).not.toContain('"raw"');
  expect(stored).not.toContain('"sources"');
  expect(errors).toEqual([]);
  report.success = true;
} catch (error) {
  report.error = String(error.message)
    .replace(/https?:\/\/[^\s]+/g, "[url]")
    .slice(0, 1000);
  process.exitCode = 1;
} finally {
  await browser.close();
  await mkdir(".cache/incheon", { recursive: true });
  await writeFile(
    `.cache/incheon/browser-${Date.now()}.json`,
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
}
