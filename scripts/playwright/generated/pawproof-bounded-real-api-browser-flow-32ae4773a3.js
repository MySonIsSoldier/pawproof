/** Opt-in live browser test against an already running, configured local server. */
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
const require = createRequire(import.meta.url);
const { chromium, expect } = require("@playwright/test");
const base = process.argv[2] || "http://localhost:3000/absproxy/3000/";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname))
  throw new Error("Use a local verification server");
const run = Date.now();
const report = {
  checkedAt: new Date().toISOString(),
  requests: [],
  checks: [],
  success: false,
};
const summary = (result) => ({
  mode: result.mode,
  totalTravel: result.totalTravel,
  travelBasis: result.travelBasis,
  visits: result.visits.map((v) => ({
    id: v.place.id,
    name: v.place.name,
    status: v.status,
    arrival: v.arrival,
    rules: v.policy.rules.length,
    unresolved: v.policy.unresolved.length,
    missing: v.findings.filter((f) => f.quote === null).map((f) => f.kind),
  })),
});
const browser = await chromium.launch({ headless: true });
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
    if (route.request().method() === "POST" && ++posts > 4) {
      await route.abort();
      throw new Error("Live browser POST budget exceeded");
    }
    await route.continue();
  });
  async function action(path, click) {
    const started = Date.now();
    const pending = page.waitForResponse(
      (r) => new URL(r.url()).pathname.endsWith(path),
      { timeout: 240000 },
    );
    await click();
    const response = await pending;
    const body = await response.json();
    report.requests.push({
      path,
      status: response.status(),
      ms: Date.now() - started,
    });
    expect(response.ok()).toBe(true);
    return body;
  }
  await page.goto(new URL("plan", base).href);
  await expect(
    page.getByRole("button", { name: "실제 장소", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByLabel("반려견 1 이름").fill("실사용 검증견");
  await page.getByLabel("반려견 1 견종").fill("골든리트리버");
  await page.getByLabel("반려견 1 체중").fill("12");
  await page.getByLabel("장소 검색", { exact: true }).fill("인천");
  await action("/api/places", () =>
    page.getByRole("button", { name: "검색", exact: true }).click(),
  );
  const names = ["개떼놀이터 인천점", "인천 차이나타운", "자유공원(인천)"];
  for (const name of names)
    await page
      .getByRole("button", { name: name + " 담기", exact: true })
      .click();
  const verified = await action("/api/verify", () =>
    page.getByRole("button", { name: "이 코스 검사하기", exact: true }).click(),
  );
  expect(verified.mode).toBe("live");
  expect(verified.travelBasis).toBe("kakao");
  expect(verified.totalTravel).toBeGreaterThan(0);
  for (const visit of verified.visits) {
    expect(visit.place.source).toBe("kto");
    expect(visit.policy.raw.length).toBeGreaterThan(0);
    expect(visit.policy.rules.length).toBeGreaterThan(0);
    expect(visit.policy.unresolved.join(" ")).not.toContain(
      "규정을 해석하지 못했어요",
    );
    for (const rule of visit.policy.rules)
      expect(visit.policy.raw).toContain(rule.quote);
  }
  const cafe = verified.visits[0];
  expect(
    cafe.policy.rules.some(
      (r) => r.kind === "weight" && r.operator === "unknown",
    ),
  ).toBe(true);
  expect(
    cafe.policy.rules.some(
      (r) =>
        r.kind === "equipment" &&
        r.items.some((i) => ["물티슈", "배변봉투"].includes(i)),
    ),
  ).toBe(false);
  report.verification = summary(verified);
  report.checks.push(
    "live search and three-place verification",
    "quote validation",
    "age exception preserved",
    "provided supplies excluded",
  );
  await expect(
    page.getByRole("heading", { name: "코스 확인 결과" }),
  ).toBeVisible();
  const first = page.getByRole("article", { name: "1번 방문지 " + names[0] });
  await first.getByRole("button", { name: "근거 보기" }).click();
  await expect(page.getByRole("dialog")).toContainText("한국관광공사");
  await page.keyboard.press("Escape");
  report.checks.push("evidence dialog");
  const third = page.getByRole("article", { name: "3번 방문지 " + names[2] });
  const recovered = await action("/api/recover", () =>
    third.getByRole("button", { name: "대체 장소 찾기" }).click(),
  );
  report.recovery = {
    inspected: recovered.inspected,
    alternatives: recovered.alternatives.length,
  };
  const panel = page.getByRole("region", { name: "대체 장소 비교" });
  await expect(panel).toBeVisible();
  if (recovered.alternatives.length) {
    await panel.getByRole("button", { name: "이 장소로 교체" }).first().click();
    await expect(third).not.toBeVisible();
    await page.getByRole("button", { name: "교체 전 코스로 되돌리기" }).click();
    await expect(third).toBeVisible();
    report.checks.push("eligible replacement and undo");
  } else {
    await expect(panel).toContainText("유효한 후보가 없어요");
    await expect(third).toBeVisible();
    report.checks.push("no eligible alternative; itinerary preserved");
  }
  await page.getByLabel("반려견 1 체중").fill("20");
  await expect(
    page.getByRole("status").filter({ hasText: "입력이 변경되었어요" }),
  ).toBeVisible();
  const again = await action("/api/verify", () =>
    page
      .getByRole("button", { name: "코스 다시 검사하기", exact: true })
      .click(),
  );
  expect(
    again.visits[0].findings.some(
      (f) => f.kind === "weight" && f.status === "blocked",
    ),
  ).toBe(false);
  expect(
    again.visits[0].findings.some(
      (f) => f.kind === "weight" && f.status === "confirm",
    ),
  ).toBe(true);
  report.reverification = summary(again);
  await page
    .getByRole("button", { name: "이 기기에 저장", exact: true })
    .click();
  const stored = await page.evaluate(() =>
    localStorage.getItem("pawproof.trip.v1"),
  );
  expect(stored).toContain("실사용 검증견");
  expect(stored).not.toContain('"raw"');
  expect(stored).not.toContain('"rules"');
  await page.reload();
  await page.getByRole("button", { name: "불러오기", exact: true }).click();
  await expect(page.getByLabel("반려견 1 체중")).toHaveValue("20");
  await expect(
    page.getByRole("heading", { name: "코스 확인 결과" }),
  ).toHaveCount(0);
  expect(errors).toEqual([]);
  report.checks.push(
    "profile change and reverify",
    "input-only save and reload",
    "zero browser exceptions",
  );
  report.success = true;
} catch (error) {
  // No provider payloads, credentials, source text, or Playwright network traces on disk.
  report.error = String(error.message)
    .replace(/https?:\/\/[^\s]+/g, "[url]")
    .slice(0, 1000);
  process.exitCode = 1;
} finally {
  await browser.close();
  await mkdir(".cache/live", { recursive: true });
  await writeFile(
    `.cache/live/browser-${run}.json`,
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
}
