import { test, expect } from "@playwright/test";
import { auth, db, email, createUser, login } from "./helpers";
test("signup redirects to planner; profile verification and registered pets are reusable", async ({
  page,
}, info) => {
  // Reproduce browsers that lack the newer AbortSignal static methods.
  await page.addInitScript(() => {
    Object.defineProperty(AbortSignal, "any", { value: undefined });
    Object.defineProperty(AbortSignal, "timeout", { value: undefined });
  });
  const address = email();
  await page.goto("./");
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("separator")).toBeVisible();
  await expect(dialog.getByRole("separator")).toHaveCSS("height", "1px");
  await expect(dialog.getByText("또는 이메일로")).toHaveCount(0);
  const signup = dialog.getByRole("button", { name: "회원가입", exact: true });
  const reset = dialog.getByRole("button", {
    name: "비밀번호 찾기",
    exact: true,
  });
  const signupBox = (await signup.boundingBox())!;
  const resetBox = (await reset.boundingBox())!;
  const dialogBox = (await dialog.boundingBox())!;
  expect(resetBox.x - signupBox.x - signupBox.width).toBeGreaterThanOrEqual(24);
  expect(
    Math.abs(
      (signupBox.x + resetBox.x + resetBox.width) / 2 -
        (dialogBox.x + dialogBox.width / 2),
    ),
  ).toBeLessThan(2);
  await dialog.screenshot({ path: info.outputPath("login.png") });
  await expect(page.getByLabel("이메일", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "회원가입", exact: true }).click();
  await expect(page.getByLabel("비밀번호", { exact: true })).toHaveAttribute(
    "minlength",
    "10",
  );
  await expect(page.getByText("10자 이상으로 입력해 주세요.")).toBeVisible();
  await page
    .getByRole("dialog")
    .screenshot({ path: info.outputPath("signup.png") });
  await page.getByLabel("이메일", { exact: true }).fill(address);
  await page.getByLabel("비밀번호", { exact: true }).fill("TenChars1!");
  await page
    .getByRole("button", { name: "이메일로 가입", exact: true })
    .click();
  await expect(page).toHaveURL(/\/plan(?:\?|$)/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.locator('[data-sonner-toast][data-type="success"]'),
  ).toContainText("가입했어요");
  const avatar = page.getByRole("link", { name: "프로필", exact: true });
  await expect(avatar).toHaveAttribute("href", /\/profile$/);
  await expect(avatar).toHaveCSS("border-radius", "50%");
  expect(
    await avatar.evaluate(
      (node) => node === node.parentElement?.lastElementChild,
    ),
  ).toBe(true);
  await avatar.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "나의 계정", exact: true }),
  ).toBeVisible();
  const user = await auth.getUserByEmail(address);
  await auth.updateUser(user.uid, { emailVerified: true });
  await page.getByRole("button", { name: "인증 완료 확인" }).click();
  await expect(
    page.getByText("이메일 인증 완료", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "반려견 등록", exact: true }).click();
  await page.getByLabel("등록 반려견 1 이름").fill("콩이");
  await page.getByLabel("등록 반려견 1 견종").fill("푸들");
  await page.getByLabel("등록 반려견 1 체중").fill("7.5");
  await page.getByRole("button", { name: "프로필 저장", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "프로필 저장", exact: true }),
  ).toBeDisabled();
  await page.reload();
  await expect(page.getByLabel("등록 반려견 1 이름")).toHaveValue("콩이");
  await page.screenshot({
    path: info.outputPath("profile.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const viewport = page.viewportSize()!;
  await page.setViewportSize({ width: 320, height: 840 });
  await expect(avatar).toBeVisible();
  expect((await avatar.boundingBox())!.width).toBe(44);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.setViewportSize(viewport);
  await page.getByRole("link", { name: "여행 노트로 가기" }).click();
  await page.getByRole("button", { name: "콩이 · 7.5kg" }).click();
  await expect(page.getByLabel("반려견 2 이름", { exact: true })).toHaveValue(
    "콩이",
  );
  await expect(page.getByLabel("반려견 2 체중", { exact: true })).toHaveValue(
    "7.5",
  );
  await expect(page.getByText("자동 저장됨", { exact: true })).toBeVisible();
  expect(
    (await db.collection(`accounts/${user.uid}/trips`).get()).docs[0].data()
      .trip.visits,
  ).toEqual([]);
});

test("password reset stays available below the login form", async ({
  page,
}) => {
  const user = await createUser();
  await page.goto("./");
  await page
    .getByRole("banner")
    .getByRole("button", { name: "로그인", exact: true })
    .click();
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
});

test("account avatar shows the account photo and falls back when it cannot load", async ({
  page,
}) => {
  const user = await createUser();
  const photoURL = "https://avatar.example.test/profile.svg";
  await auth.updateUser(user.uid, { displayName: "콩이 보호자", photoURL });
  let photoAvailable = true;
  await page.route(photoURL, (route) =>
    photoAvailable
      ? route.fulfill({
          contentType: "image/svg+xml",
          headers: { "cache-control": "no-store" },
          body: '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36"><rect width="36" height="36" fill="#2e6a52"/></svg>',
        })
      : route.abort(),
  );
  await page.goto("./");
  await login(page, user.email);
  await expect(page).toHaveURL(/\/plan(?:\?|$)/);
  const avatar = page.getByRole("link", { name: "프로필", exact: true });
  await expect(avatar.locator("img")).toBeVisible();
  await expect(avatar.locator("img")).toHaveAttribute(
    "referrerpolicy",
    "no-referrer",
  );
  photoAvailable = false;
  await page.reload();
  await expect(avatar).toHaveText("콩");
  await avatar.click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("a profile draft is discarded when another tab switches accounts", async ({
  page,
  context,
}) => {
  const first = await createUser();
  const second = await createUser();
  await page.goto("./");
  await login(page, first.email);
  await expect(page).toHaveURL(/\/plan(?:\?|$)/);
  await page.getByRole("link", { name: "프로필", exact: true }).click();
  await page.getByRole("button", { name: "반려견 등록", exact: true }).click();
  await page.getByLabel("등록 반려견 1 이름").fill("이전 계정 초안");

  const other = await context.newPage();
  await other.goto("./profile");
  await other.getByRole("button", { name: "로그아웃", exact: true }).click();
  await expect(
    other.getByRole("heading", { name: "우리 강아지와, 끝까지 함께." }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "반려견과 여행을 함께 보관하세요" }),
  ).toBeVisible();
  await login(other, second.email);
  await expect(other).toHaveURL(/\/plan(?:\?|$)/);
  await expect(page.getByText(second.email, { exact: true })).toBeVisible();
  await expect(page.getByLabel("등록 반려견 1 이름")).toHaveCount(0);
  await expect(
    page.getByText("첫 반려견을 등록해 주세요.", { exact: false }),
  ).toBeVisible();
  expect(
    (await db.doc(`accounts/${second.uid}/profile/main`).get()).exists,
  ).toBe(false);
});
