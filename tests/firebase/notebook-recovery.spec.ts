import { test, expect } from "@playwright/test";
import { createUser, login, db } from "./helpers";

test("verification-only guest work is saved on login and failed conflict recovery keeps the draft", async ({
  page,
}) => {
  const user = await createUser();
  await page.goto("plan?mode=demo");
  await page
    .getByRole("button", { name: "이 코스 검사하기", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "코스 확인 결과" }),
  ).toBeVisible();
  await login(page, user.email);
  const panel = page.getByRole("region", { name: "계정 여행 노트" });
  await expect(panel.getByText("자동 저장됨", { exact: true })).toBeVisible();
  const notes = await db.collection(`accounts/${user.uid}/trips`).get();
  expect(notes.size).toBe(1);
  expect(notes.docs[0].data().verification).not.toBeNull();
  await page.route("**/api/account/trips/*", (route) =>
    route.fulfill({
      status: route.request().method() === "PUT" ? 409 : 503,
      json: {
        error:
          route.request().method() === "PUT"
            ? "다른 기기에서 수정했어요"
            : "노트 연결 점검 중",
      },
    }),
  );
  await page
    .getByLabel("반려견 1 이름", { exact: true })
    .fill("아직 저장하지 못한 입력");
  await expect(panel.getByRole("alert")).toContainText(
    "다른 기기에서 수정했어요",
  );
  const draft = await page.evaluate(
    (uid) => sessionStorage.getItem(`pawproof.pending-note.${uid}`),
    user.uid,
  );
  expect(draft).toContain("아직 저장하지 못한 입력");
  await panel
    .getByRole("button", { name: "내 여행 노트", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "내 여행 노트", exact: true })
    .getByRole("button", { name: "노트 열기", exact: true })
    .click();
  const confirmation = page.getByRole("dialog", {
    name: "저장하지 못한 변경사항을 버릴까요?",
  });
  await confirmation
    .getByRole("button", { name: "변경사항 버리고 열기" })
    .click();
  await expect(confirmation.getByRole("alert")).toHaveText("노트 연결 점검 중");
  expect(
    await page.evaluate(
      (uid) => sessionStorage.getItem(`pawproof.pending-note.${uid}`),
      user.uid,
    ),
  ).toBe(draft);
  await page.unroute("**/api/account/trips/*");
  await confirmation
    .getByRole("button", { name: "변경사항 버리고 열기" })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByLabel("반려견 1 이름", { exact: true })).toHaveValue(
    "두부",
  );
  await expect(panel.getByText("자동 저장됨", { exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      (uid) => sessionStorage.getItem(`pawproof.pending-note.${uid}`),
      user.uid,
    ),
  ).toBeNull();
});
