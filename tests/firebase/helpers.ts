import { randomUUID } from "node:crypto";
import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import type { Page } from "@playwright/test";
if (
  process.env.FIREBASE_AUTH_EMULATOR_HOST !== "127.0.0.1:9099" ||
  process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:8080"
)
  throw new Error("Tests require isolated local emulators.");
const app =
  getApps().find((app) => app.name === "tests") ||
  initializeApp({ projectId: "demo-pawproof" }, "tests");
export const auth = getAuth(app);
export const db = getFirestore(app);
export const password = "Only-Local-Test-123!";
export function email() {
  return `test-${randomUUID()}@example.test`;
}
export async function createUser(verified = true) {
  const address = email();
  const user = await auth.createUser({
    email: address,
    password,
    emailVerified: verified,
  });
  const response = await fetch(
    "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-api-key",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: address,
        password,
        returnSecureToken: true,
      }),
    },
  );
  const data = await response.json();
  if (!response.ok || !data.idToken)
    throw new Error("Emulator sign-in failed.");
  return { uid: user.uid, email: address, token: data.idToken as string };
}
export async function login(page: Page, email: string) {
  await page
    .getByRole("banner")
    .getByRole("button", { name: "로그인", exact: true })
    .click();
  await page.getByLabel("이메일", { exact: true }).fill(email);
  await page.getByLabel("비밀번호", { exact: true }).fill(password);
  await page
    .getByRole("button", { name: "이메일로 로그인", exact: true })
    .click();
}
