import { readFile, writeFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

const production = process.env.E2E_MODE === "production";

test("HTML, CSS, JS, client navigation, deep refresh and health route", async ({ page, baseURL }) => {
  const errors: string[] = [];
  const scripts: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.url().includes("/_next/") && response.url().includes(".js")) {
      // A 304 reuses the browser's previously validated body and may omit MIME headers.
      if (response.status() !== 304 && (response.status() !== 200 || !/javascript/u.test(response.headers()["content-type"] || ""))) errors.push("Invalid script response");
      scripts.push(response.url());
    }
  });
  const response = await page.goto("./");
  expect(response?.status()).toBe(200);
  expect(response?.headers()["content-type"]).toContain("text/html");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("우리 강아지");
  await expect(page.locator("body")).toHaveCSS("margin", "0px");
  await page.getByRole("link", { name: "PawProof 소개" }).click();
  await expect(page).toHaveURL(/\/about$/u);
  await page.reload();
  await expect(page.getByRole("heading", { name: "PawProof 소개" })).toBeVisible();
  await page.getByRole("link", { name: "처음으로" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("우리 강아지");
  const health = await page.evaluate(async (url) => {
    const response = await fetch(url);
    return { status: response.status, body: await response.json() };
  }, new URL("api/health", baseURL).href);
  expect(health).toEqual({ status: 200, body: { status: "ok", service: "pawproof" } });
  expect(scripts.length).toBeGreaterThan(0);
  expect(errors).toEqual([]);
  if (production) expect(await page.content()).not.toContain("/absproxy/");
});

test("development-only browser utility check and HMR preserve client state", async ({ page }) => {
  test.skip(production, "Diagnostic UI is unavailable in production.");
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const socketOpened = page.waitForEvent("websocket", (socket) => socket.url().includes("/_next/"));
  await page.goto("dev/check");
  const socket = await socketOpened;
  const receivedFrame = socket.waitForEvent("framereceived");
  await expect(page.getByRole("img", { name: "경로 확인 이미지" })).toBeVisible();
  expect(await page.getByRole("img", { name: "경로 확인 이미지" }).evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBe(48);
  await page.getByRole("button", { name: "API 연결 확인" }).click();
  await expect(page.getByRole("status")).toHaveText("API 정상 응답 1회");

  const sourceFile = new URL("../../src/features/development/environment-check.tsx", import.meta.url);
  const original = await readFile(sourceFile, "utf8");
  const changed = original.replace("<h1>개발 환경 점검</h1>", "<h1>개발 환경 점검 · HMR</h1>");
  expect(changed).not.toBe(original);
  try {
    await writeFile(sourceFile, changed);
    await receivedFrame;
    await expect(page.getByRole("heading", { name: "개발 환경 점검 · HMR", exact: true })).toBeVisible();
    await expect(page.getByRole("status")).toHaveText("API 정상 응답 1회");
  } finally {
    if (await readFile(sourceFile, "utf8") === changed) await writeFile(sourceFile, original);
  }
  await expect(page.getByRole("heading", { name: "개발 환경 점검", exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("production hides diagnostics and serves public assets at the root", async ({ page, request }) => {
  test.skip(!production, "Production-only guard.");
  const response = await page.goto("dev/check");
  expect(response?.status()).toBe(404);
  const asset = await request.get("fixtures/path-check.svg");
  expect(asset.status()).toBe(200);
  expect(asset.headers()["content-type"]).toContain("image/svg+xml");
});
