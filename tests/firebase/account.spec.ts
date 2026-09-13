import { test, expect } from "@playwright/test";
import { db, createUser, login } from "./helpers";
import { createDemoTrip } from "../../src/fixtures/demo-trip";
import { demoProviders } from "../../src/infrastructure/demo/catalog";
import { verifyTrip } from "../../src/application/use-cases/verify-trip";

test("live places and verification summary survive autosave, a new note and reload", async ({
  page,
}, info) => {
  const user = await createUser();
  const example = await verifyTrip(
    createDemoTrip("2026-09-20"),
    demoProviders(),
  );
  const places = example.visits.map((v, i) => ({
    ...v.place,
    id: String(1000 + i),
    source: "kto" as const,
    name: `인천 검증 장소 ${i + 1}`,
  }));
  const result = {
    ...example,
    mode: "live",
    visits: example.visits.map((v, i) => ({
      ...v,
      place: places[i],
      visit: { ...v.visit, placeId: places[i].id },
    })),
  };
  await page.route("**/api/places?*", (route) =>
    route.fulfill({ json: { places } }),
  );
  await page.route("**/api/verify", async (route) => {
    const input = route.request().postDataJSON();
    await route.fulfill({
      json: {
        ...result,
        visits: result.visits.map((v, i) => ({ ...v, visit: input.visits[i] })),
      },
    });
  });
  await page.goto("./");
  await login(page, user.email);
  await expect(page).toHaveURL(/\/plan(?:\?|$)/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.locator('[data-sonner-toast][data-type="success"]'),
  ).toContainText("로그인했어요");
  await expect(page.getByText("인천에서 먼저 둘러볼 곳")).toBeVisible();
  await page.getByLabel("반려견 1 이름", { exact: true }).fill("두부");
  await page.getByLabel("반려견 1 견종", { exact: true }).fill("골든리트리버");
  await page.getByLabel("반려견 1 체중", { exact: true }).fill("12");
  for (const place of places)
    await page
      .getByRole("button", { name: `${place.name} 담기`, exact: true })
      .click();
  await page
    .getByRole("button", { name: "이 코스 검사하기", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "코스 확인 결과" }),
  ).toBeVisible();
  const panel = page.getByRole("region", { name: "계정 여행 노트" });
  await panel.getByLabel("노트 제목").fill("인천 자동 저장 검증");
  await expect(panel.getByText("자동 저장됨", { exact: true })).toBeVisible();
  const notes = await db.collection(`accounts/${user.uid}/trips`).get();
  expect(notes.size).toBe(1);
  const record = notes.docs[0].data();
  expect(record.verification.result.visits[0].status).toBe(
    result.visits[0].status,
  );
  expect(JSON.stringify(record)).not.toContain('"raw"');
  expect(JSON.stringify(record)).not.toContain('"quote"');
  expect(JSON.stringify(record)).not.toContain('"policy"');
  await panel.getByRole("button", { name: "새 여행 노트" }).click();
  await expect(page.locator(".visit-card")).toHaveCount(0);
  await panel
    .getByRole("button", { name: "내 여행 노트", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "내 여행 노트", exact: true })
    .getByRole("button", { name: "노트 열기", exact: true })
    .click();
  await expect(page.locator(".visit-card")).toHaveCount(places.length);
  await expect(page.locator(".visit-card").first()).toContainText(
    places[0].name,
  );
  await expect(page.getByText(/저장 당시 검사 결과 ·/)).toBeVisible();
  await page.reload();
  await expect(page.locator(".visit-card").first()).toContainText(
    places[0].name,
  );
  await expect(page.getByText(/저장 당시 검사 결과 ·/)).toBeVisible();
  await page.screenshot({
    path: info.outputPath("restored-note.png"),
    fullPage: true,
  });
  await page.getByLabel("반려견 1 체중", { exact: true }).fill("20");
  await expect(
    page.getByText("입력이 변경되었어요. 다시 검사해 주세요.", { exact: true }),
  ).toBeVisible();
  await expect(panel.getByText("자동 저장됨", { exact: true })).toBeVisible();
  await panel
    .getByRole("button", { name: "내 여행 노트", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "내 여행 노트", exact: true })
    .getByRole("button", { name: "삭제", exact: true })
    .click();
  await page.getByRole("button", { name: "삭제 확인" }).click();
  await expect(
    page
      .getByRole("dialog", { name: "내 여행 노트", exact: true })
      .getByText("첫 여행을 기다리고 있어요"),
  ).toBeVisible();
  expect((await db.collection(`accounts/${user.uid}/trips`).get()).empty).toBe(
    true,
  );
});

test("autosave retains concurrent edits and reports network failure without losing the draft", async ({
  page,
}) => {
  const user = await createUser();
  await page.goto("./plan?mode=demo");
  await login(page, user.email);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const panel = page.getByRole("region", { name: "계정 여행 노트" });
  let release: () => void = () => {};
  let intercepted = false;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/account/trips/*", async (route) => {
    if (route.request().method() === "PUT" && !intercepted) {
      intercepted = true;
      await gate;
    }
    await route.continue();
  });
  await page.getByLabel("반려견 1 이름", { exact: true }).fill("첫 입력");
  await expect.poll(() => intercepted).toBe(true);
  await page.getByLabel("반려견 1 이름", { exact: true }).fill("저장 중 수정");
  release();
  await expect(panel.getByText("자동 저장됨", { exact: true })).toBeVisible();
  const notes = await db.collection(`accounts/${user.uid}/trips`).get();
  expect(notes.size).toBe(1);
  expect(notes.docs[0].data().trip.pets[0].name).toBe("저장 중 수정");
  await page.unroute("**/api/account/trips/*");
  await page.route("**/api/account/trips/*", (route) =>
    route.fulfill({ status: 503, json: { error: "연결 점검 중" } }),
  );
  await page.getByLabel("반려견 1 이름", { exact: true }).fill("실패해도 보존");
  await expect(panel.getByRole("alert")).toContainText("연결 점검 중");
  await expect(page.getByLabel("반려견 1 이름", { exact: true })).toHaveValue(
    "실패해도 보존",
  );
  await page.unroute("**/api/account/trips/*");
  await panel.getByRole("button", { name: "자동 저장 다시 시도" }).click();
  await expect(panel.getByText("자동 저장됨", { exact: true })).toBeVisible();
  expect((await notes.docs[0].ref.get()).data()!.trip.pets[0].name).toBe(
    "실패해도 보존",
  );
  await panel.getByRole("button", { name: "새 여행 노트" }).click();
  await panel.getByLabel("노트 제목").fill("두 번째 여행");
  await page
    .getByLabel("반려견 1 이름", { exact: true })
    .fill("삭제 중에도 보존");
  await panel
    .getByRole("button", { name: "내 여행 노트", exact: true })
    .click();
  const previous = page
    .getByRole("dialog", { name: "내 여행 노트", exact: true })
    .getByRole("article")
    .filter({
      has: page.getByRole("heading", {
        name: notes.docs[0].data().title,
        exact: true,
      }),
    });
  await previous.getByRole("button", { name: "삭제", exact: true }).click();
  const deletion = page.waitForResponse(
    (r) =>
      r.request().method() === "DELETE" &&
      r.url().includes("/api/account/trips/"),
  );
  await page.getByRole("button", { name: "삭제 확인" }).click();
  expect((await deletion).status()).toBe(200);
  await expect(previous).toHaveCount(0);
  const remaining = await db.collection(`accounts/${user.uid}/trips`).get();
  expect(remaining.size).toBe(1);
  expect(remaining.docs[0].data().trip.pets[0].name).toBe("삭제 중에도 보존");
  await page.getByRole("button", { name: "노트 목록 닫기" }).click();
  await page.getByRole("link", { name: "프로필", exact: true }).click();
  await page.getByRole("button", { name: "로그아웃", exact: true }).click();
  const other = await createUser();
  await login(page, other.email);
  await expect(page).toHaveURL(/\/plan(?:\?|$)/);
  await panel
    .getByRole("button", { name: "내 여행 노트", exact: true })
    .click();
  await expect(
    page
      .getByRole("dialog", { name: "내 여행 노트", exact: true })
      .getByText("첫 여행을 기다리고 있어요"),
  ).toBeVisible();
});
