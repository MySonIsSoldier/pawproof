// Explicit opt-in. Creates one temporary user/note and cleans up only that UID.
// Never record credentials, token responses, traces, or provider error messages.
import nextEnv from "@next/env";
import { randomUUID, randomBytes, createPrivateKey } from "node:crypto";
import { createRequire } from "node:module";
import { cert, initializeApp, deleteApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
const { chromium, expect } = createRequire(import.meta.url)("@playwright/test");
nextEnv.loadEnvConfig(process.cwd(), true);
if (process.env.FIREBASE_LIVE_CHECK !== "true")
  throw new Error("Set FIREBASE_LIVE_CHECK=true for this real-project check.");
const base = new URL(process.argv[2] || "http://localhost:3000/absproxy/3000/");
if (!["localhost", "127.0.0.1"].includes(base.hostname))
  throw new Error("Use a local application preview URL.");
const required = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
];
let stage = "configuration",
  app,
  db,
  auth,
  browser,
  user,
  page;
const uid = `pawproof-check-${randomUUID()}`;
const email = `${uid}@example.test`;
const password = `Aa1!${randomBytes(18).toString("hex")}`;
const pass = (name) => console.log(`PASS: ${name}`);
const safeCode = (error) =>
  /^[a-zA-Z0-9/_-]{1,80}$/.test(
    String(error?.code || error?.name || "check-failed"),
  )
    ? String(error.code || error.name || "check-failed")
    : "check-failed";
try {
  for (const name of required)
    if (!process.env[name]?.trim()) throw new Error("Missing configuration");
  if (
    process.env.FIREBASE_PROJECT_ID !==
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.FIREBASE_AUTH_EMULATOR_HOST ||
    process.env.FIRESTORE_EMULATOR_HOST ||
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL
  )
    throw new Error("Configuration mismatch");
  const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");
  createPrivateKey(privateKey);
  pass(stage);
  app = initializeApp(
    {
      projectId: process.env.FIREBASE_PROJECT_ID,
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    },
    "pawproof-live-validation",
  );
  auth = getAuth(app);
  db = getFirestore(app);
  stage = "Admin Auth and Firestore access";
  await auth.getUser(uid).then(
    () => {
      throw new Error("UID collision");
    },
    (error) => {
      if (error.code !== "auth/user-not-found") throw error;
    },
  );
  if ((await db.doc(`accounts/${uid}`).get()).exists)
    throw new Error("UID collision");
  pass(stage);
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  page = await context.newPage();
  page.setDefaultTimeout(25000);
  const pageErrors = [];
  page.on("pageerror", (error) => {
    pageErrors.push(true);
    console.log(`Browser exception: ${safeCode(error)}`);
  });
  stage = "planner page navigation";
  await page.goto(new URL("plan?mode=demo", base).href, {
    waitUntil: "networkidle",
    timeout: 90000,
  });
  stage = "open login dialog";
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible({ timeout: 15000 });
  stage = "signup tab and password constraint";
  await page.getByRole("button", { name: "회원가입", exact: true }).click();
  stage = "ten-character signup constraint";
  await expect(page.getByLabel("비밀번호", { exact: true })).toHaveAttribute(
    "minlength",
    "10",
  );
  await expect(page.getByText("10자 이상으로 입력해 주세요.")).toBeVisible();
  stage = "return to email login tab";
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "이메일 로그인", exact: true })
    .click();
  stage = "temporary user creation";
  user = await auth.createUser({ uid, email, password, emailVerified: false });
  pass(stage);
  stage = "email password login";
  await page.getByLabel("이메일", { exact: true }).fill(email);
  await page.getByLabel("비밀번호", { exact: true }).fill(password);
  const signIn = page.waitForResponse((r) =>
    r.url().includes("accounts:signInWithPassword"),
  );
  await page
    .getByRole("button", { name: "이메일로 로그인", exact: true })
    .click();
  const response = await signIn;
  expect(response.status()).toBe(200);
  const { idToken } = await response.json();
  await expect(
    page.getByRole("heading", { name: "우리의 여행 노트" }),
  ).toBeVisible();
  pass(stage);
  stage = "unverified and unauthenticated API denial";
  const api = new URL("api/account/trips", base).href;
  expect((await context.request.get(api)).status()).toBe(401);
  expect(
    (
      await context.request.get(api, {
        headers: { Authorization: `Bearer ${idToken}` },
      })
    ).status(),
  ).toBe(403);
  pass(stage);
  stage = "Firestore direct client read/write denial";
  const docUrl = `https://firestore.googleapis.com/v1/projects/${process.env.FIREBASE_PROJECT_ID}/databases/(default)/documents/accounts/${uid}`;
  for (const method of ["GET", "PATCH"]) {
    const response = await fetch(docUrl, {
      method,
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
      ...(method === "PATCH"
        ? {
            body: JSON.stringify({
              fields: { tripCount: { integerValue: "0" } },
            }),
          }
        : {}),
      signal: AbortSignal.timeout(20000),
    });
    expect(response.status).toBe(403);
  }
  pass(stage);
  stage = "verified token refresh";
  // No email sent: checks the refresh/server gate, not delivery or verification links.
  await auth.updateUser(uid, { emailVerified: true });
  await page.getByRole("link", { name: "프로필", exact: true }).click();
  await page.getByRole("button", { name: "인증 완료 확인" }).click();
  await expect(
    page.getByRole("button", { name: "인증 완료 확인" }),
  ).toHaveCount(0);
  await page.goto(new URL("plan?mode=demo", base).href, {
    waitUntil: "networkidle",
  });
  pass(stage);
  stage = "cloud note create and list";
  const panel = page.getByRole("region", { name: "계정 여행 노트" });
  await panel.getByLabel("노트 제목").fill("자동 연결 점검 · 종료 후 삭제");
  await expect(
    panel.getByText("모든 변경사항을 저장했어요", { exact: true }),
  ).toBeVisible();
  await panel
    .getByRole("button", { name: "계정 노트 목록", exact: true })
    .click();
  await expect(
    panel.getByRole("heading", { name: "자동 연결 점검 · 종료 후 삭제" }),
  ).toBeVisible();
  const saved = await db.collection(`accounts/${uid}/trips`).get();
  expect(saved.size).toBe(1);
  expect(saved.docs[0].data().revision).toBe(1);
  pass(stage);
  stage = "cloud note update, login persistence and reload";
  await page.getByLabel("반려견 1 이름", { exact: true }).fill("연결점검");

  await expect
    .poll(async () => (await saved.docs[0].ref.get()).data()?.revision)
    .toBe(2);
  await page.reload();
  await expect(
    page.getByRole("link", { name: "프로필", exact: true }),
  ).toBeVisible();
  await panel
    .getByRole("button", { name: "계정 노트 목록", exact: true })
    .click();
  await panel
    .getByRole("button", { name: "노트 불러오기", exact: true })
    .click();
  await page.getByRole("button", { name: "입력 바꾸고 불러오기" }).click();
  await expect(page.getByLabel("반려견 1 이름", { exact: true })).toHaveValue(
    "연결점검",
  );
  pass(stage);
  stage = "cloud note deletion and logout";
  await panel.getByRole("button", { name: "계정 노트 삭제" }).click();
  await page.getByRole("button", { name: "삭제 확인" }).click();
  await expect(panel.getByText("아직 저장한 노트가 없어요.")).toBeVisible();
  expect((await saved.docs[0].ref.get()).exists).toBe(false);
  await page.getByRole("link", { name: "프로필", exact: true }).click();
  await page.getByRole("button", { name: "로그아웃", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "로그인", exact: true }),
  ).toBeVisible();
  expect(pageErrors).toHaveLength(0);
  pass(stage);
} catch (error) {
  if (page)
    await page
      .screenshot({
        path: ".cache/firebase-live-failure.png",
        mask: [page.locator("input")],
      })
      .catch(() => {});
  console.error(`FAIL: ${stage} (${safeCode(error)})`);
  process.exitCode = 1;
} finally {
  await browser?.close().catch(() => {
    console.error("FAIL: browser cleanup");
    process.exitCode = 1;
  });
  if (user) {
    for (const [name, clean] of [
      [
        "temporary Firestore data",
        async () => {
          const owner = db.doc(`accounts/${uid}`);
          const notes = await owner.collection("trips").get();
          const batch = db.batch();
          for (const doc of notes.docs) batch.delete(doc.ref);
          batch.delete(owner);
          await batch.commit();
          expect((await owner.get()).exists).toBe(false);
          expect((await owner.collection("trips").get()).empty).toBe(true);
        },
      ],
      [
        "temporary Auth user",
        async () => {
          await auth.deleteUser(uid);
          await auth.getUser(uid).then(
            () => {
              throw new Error("Cleanup failed");
            },
            (error) => {
              if (error.code !== "auth/user-not-found") throw error;
            },
          );
        },
      ],
    ]) {
      try {
        await clean();
        pass(`${name} cleaned`);
      } catch (error) {
        console.error(`FAIL: ${name} cleanup (${safeCode(error)})`);
        process.exitCode = 1;
      }
    }
  }
  await db?.terminate();
  if (app) await deleteApp(app);
}
