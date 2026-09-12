import { test, expect } from "@playwright/test";
import { auth, db, email, password, createUser, login } from "./helpers";
test("signup, email verification, save, update, reload, logout and second-account isolation", async ({
  page,
}, testInfo) => {
  const address = email();
  await page.goto("./plan?mode=demo");
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await page.getByRole("button", { name: "회원가입", exact: true }).click();
  await page
    .getByRole("dialog")
    .screenshot({ path: testInfo.outputPath("signup.png") });
  expect(
    await page
      .getByRole("dialog")
      .evaluate((element) => element.scrollWidth <= element.clientWidth),
  ).toBe(true);
  await page.getByLabel("이메일", { exact: true }).fill(address);
  await page.getByLabel("비밀번호", { exact: true }).fill(password);
  await page
    .getByRole("button", { name: "이메일로 가입", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "나의 계정", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("계정에 저장하려면 이메일 인증이 필요해요."),
  ).toBeVisible();
  const user = await auth.getUserByEmail(address);
  await auth.updateUser(user.uid, { emailVerified: true });
  await page.getByRole("button", { name: "인증 완료 확인" }).click();
  await expect(
    page.getByRole("button", { name: "인증 완료 확인" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "계정 안내 닫기" }).click();
  await expect(
    page.locator('[data-sonner-toast]:not([data-removed="true"])'),
  ).toHaveCount(0);
  const panel = page.getByRole("region", { name: "계정 여행 노트" });
  await panel.getByLabel("노트 제목").fill("두부와 송도 여행");
  await panel.getByRole("button", { name: "계정에 새 노트 저장" }).click();
  await expect(
    panel.getByRole("button", { name: "계정 노트 수정 저장" }),
  ).toBeEnabled();
  await panel
    .getByRole("button", { name: "계정 노트 목록", exact: true })
    .click();
  await expect(
    panel.getByRole("heading", { name: "두부와 송도 여행" }),
  ).toBeVisible();
  await panel.screenshot({ path: testInfo.outputPath("saved-note.png") });
  await page.getByLabel("반려견 1 이름", { exact: true }).fill("수정한 두부");
  await panel.getByRole("button", { name: "계정 노트 수정 저장" }).click();
  await expect(
    panel.getByRole("button", { name: "계정 노트 수정 저장" }),
  ).toBeEnabled();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "내 계정", exact: true }),
  ).toBeVisible();
  await panel
    .getByRole("button", { name: "계정 노트 목록", exact: true })
    .click();
  await panel
    .getByRole("button", { name: "노트 불러오기", exact: true })
    .click();
  await page.getByRole("button", { name: "입력 바꾸고 불러오기" }).click();
  await expect(page.getByLabel("반려견 1 이름", { exact: true })).toHaveValue(
    "수정한 두부",
  );
  await page.getByRole("button", { name: "내 계정", exact: true }).click();
  await page.getByRole("button", { name: "로그아웃", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "이메일로 로그인", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "계정 안내 닫기" }).click();
  await expect(
    panel.getByRole("heading", { name: "두부와 송도 여행" }),
  ).toHaveCount(0);
  const other = await createUser();
  await login(page, other.email);
  await expect(
    page.getByRole("heading", { name: "나의 계정", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "계정 안내 닫기" }).click();
  await panel
    .getByRole("button", { name: "계정 노트 목록", exact: true })
    .click();
  await expect(panel.getByText("아직 저장한 노트가 없어요.")).toBeVisible();
});

test("save failure preserves edits and deletion needs explicit confirmation", async ({
  page,
}) => {
  const user = await createUser();
  await page.goto("./plan?mode=demo");
  await login(page, user.email);
  await expect(
    page.getByRole("heading", { name: "나의 계정", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "계정 안내 닫기" }).click();
  const panel = page.getByRole("region", { name: "계정 여행 노트" });
  await panel.getByLabel("노트 제목").fill("지우기 전 확인");
  await page.route("**/api/account/trips/*", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "연결을 확인해 주세요." }),
    }),
  );
  await panel.getByRole("button", { name: "계정에 새 노트 저장" }).click();
  await expect(panel.getByRole("alert")).toHaveText("연결을 확인해 주세요.");
  await expect(panel.getByLabel("노트 제목")).toHaveValue("지우기 전 확인");
  await page.unroute("**/api/account/trips/*");
  await panel.getByRole("button", { name: "계정에 새 노트 저장" }).click();
  await expect(
    panel.getByRole("button", { name: "계정 노트 수정 저장" }),
  ).toBeEnabled();
  await panel
    .getByRole("button", { name: "계정 노트 목록", exact: true })
    .click();
  const previousId = (await db.collection(`accounts/${user.uid}/trips`).get())
    .docs[0].id;
  await panel.getByRole("button", { name: "계정 노트 삭제" }).click();
  await page.getByRole("button", { name: "취소", exact: true }).click();
  await expect(
    panel.getByRole("heading", { name: "지우기 전 확인" }),
  ).toBeVisible();
  await panel.getByRole("button", { name: "계정 노트 삭제" }).click();
  await page.getByRole("button", { name: "삭제 확인" }).click();
  await expect(panel.getByText("아직 저장한 노트가 없어요.")).toBeVisible();
  await panel.getByLabel("노트 제목").fill("새로운 노트");
  await panel.getByRole("button", { name: "계정에 새 노트 저장" }).click();
  await expect(
    panel.getByRole("heading", { name: "새로운 노트" }),
  ).toBeVisible();
  expect(
    (await db.collection(`accounts/${user.uid}/trips`).get()).docs[0].id,
  ).not.toBe(previousId);
});

test("invalid credentials stay signed out and password reset uses the emulator mail flow", async ({
  page,
}) => {
  const user = await createUser();
  await page.goto("./");
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("이메일", { exact: true }).fill(user.email);
  await dialog
    .getByLabel("비밀번호", { exact: true })
    .fill("incorrect-password");
  await dialog
    .getByRole("button", { name: "이메일로 로그인", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toHaveText(
    "이메일과 비밀번호를 확인해 주세요.",
  );
  await dialog
    .getByRole("button", { name: "비밀번호 찾기", exact: true })
    .click();
  await dialog.getByLabel("이메일", { exact: true }).fill(user.email);
  await dialog.getByRole("button", { name: "재설정 메일 받기" }).click();
  await expect(dialog.getByRole("status")).toHaveText(
    "등록된 이메일이라면 재설정 메일이 전송돼요.",
  );
  const response = await fetch(
    "http://127.0.0.1:9099/emulator/v1/projects/demo-pawproof/oobCodes",
  );
  const mail = await response.json();
  expect(
    mail.oobCodes.some(
      (item: { email: string; requestType: string }) =>
        item.email === user.email && item.requestType === "PASSWORD_RESET",
    ),
  ).toBe(true);
});
