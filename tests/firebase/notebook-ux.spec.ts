import { test, expect } from "@playwright/test";
import { createUser, login, db } from "./helpers";

test("guest work becomes an account note with inline title and a searchable library", async ({
  page,
}, info) => {
  const user = await createUser();
  await page.goto("plan?mode=demo");
  await page
    .getByLabel("반려견 1 이름", { exact: true })
    .fill("로그인 전 작성");
  await page.getByRole("button", { name: "로그인하고 이어가기" }).click();
  await page.getByRole("button", { name: "계정 안내 닫기" }).click();
  await login(page, user.email);
  const panel = page.getByRole("region", { name: "계정 여행 노트" });
  await expect(panel.getByText("자동 저장됨", { exact: true })).toBeVisible();
  await expect(page.getByLabel("반려견 1 이름", { exact: true })).toHaveValue(
    "로그인 전 작성",
  );
  await panel.getByLabel("노트 제목").fill("두부와 인천 산책");
  await expect(panel.getByText("자동 저장됨", { exact: true })).toBeVisible();
  expect(
    (await db.collection(`accounts/${user.uid}/trips`).get()).docs[0].data()
      .title,
  ).toBe("두부와 인천 산책");
  expect(
    await page.evaluate(() => {
      const event = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(event);
      return event.defaultPrevented;
    }),
  ).toBe(false);
  await page.reload();
  await expect(panel.getByLabel("노트 제목")).toHaveValue("두부와 인천 산책");
  expect((await panel.boundingBox())!.y).toBeLessThan(
    (await page.locator(".planner-grid").boundingBox())!.y,
  );
  await page.screenshot({
    path: info.outputPath("account-notebook.png"),
    fullPage: true,
  });
  await panel.getByRole("button", { name: "새 여행 노트" }).click();
  await panel
    .getByRole("button", { name: "내 여행 노트", exact: true })
    .click();
  const library = page.getByRole("dialog", {
    name: "내 여행 노트",
    exact: true,
  });
  await library.getByLabel("노트 검색").fill("없는 제목");
  await expect(library.getByText(/검색한 노트가 없어요/)).toBeVisible();
  await library.getByLabel("노트 검색").fill("인천");
  await expect(library.getByRole("article")).toHaveCount(1);
  await library.screenshot({ path: info.outputPath("note-library.png") });
  await library.getByRole("button", { name: "노트 열기", exact: true }).click();
  await expect(library).toHaveCount(0);
  await expect(panel.getByLabel("노트 제목")).toHaveValue("두부와 인천 산책");
  await expect(page.getByLabel("반려견 1 이름", { exact: true })).toHaveValue(
    "로그인 전 작성",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("switching accounts in another tab clears the previous account's planner", async ({
  page,
  context,
}) => {
  const first = await createUser();
  const second = await createUser();
  await page.goto("plan");
  await login(page, first.email);
  await page
    .getByLabel("반려견 1 이름", { exact: true })
    .fill("첫 계정의 반려견");
  await expect(page.getByText("자동 저장됨", { exact: true })).toBeVisible();
  const other = await context.newPage();
  await other.goto("profile");
  await other.getByRole("button", { name: "로그아웃", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "로그인하고 이어가기" }),
  ).toBeVisible();
  await expect(page.getByLabel("반려견 1 이름", { exact: true })).toHaveValue(
    "",
  );
  await login(other, second.email);
  await expect(page.getByLabel("노트 제목")).toBeVisible();
  await expect(page.getByLabel("반려견 1 이름", { exact: true })).toHaveValue(
    "",
  );
  await page.getByLabel("노트 제목").fill("두 번째 계정의 노트");
  await expect(page.getByText("자동 저장됨", { exact: true })).toBeVisible();
  const records = await db.collection(`accounts/${second.uid}/trips`).get();
  expect(records.size).toBe(1);
  expect(records.docs[0].data().trip.pets[0].name).toBe("");
  expect(
    await page.evaluate(() => new URL(location.href).searchParams.get("note")),
  ).toBe(records.docs[0].id);
});
