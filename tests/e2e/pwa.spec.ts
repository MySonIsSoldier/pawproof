import { test, expect } from "@playwright/test";
import { startPwaUpdateProxy } from "../support/pwa-update-proxy";

async function waitForWorker(page: import("@playwright/test").Page) {
  try {
    await page.waitForFunction(
      () => !!navigator.serviceWorker.controller,
      undefined,
      { timeout: 15000 },
    );
  } catch (error) {
    const state = await page.evaluate(async () => ({
      secure: isSecureContext,
      scopes: (await navigator.serviceWorker.getRegistrations()).map((r) => ({
        scope: r.scope,
        active: r.active?.state,
        installing: r.installing?.state,
        waiting: r.waiting?.state,
      })),
      caches: await caches.keys(),
    }));
    await test.info().attach("worker-diagnostic", {
      body: JSON.stringify(state),
      contentType: "application/json",
    });
    throw error;
  }
}

test("manifest, platform icons and scoped worker are install-ready", async ({
  page,
  request,
  baseURL,
}) => {
  // Start in the manifest's launch path, including under a proxy basePath.
  await page.goto("plan?mode=demo");
  const href = await page.locator('link[rel="manifest"]').getAttribute("href");
  expect(href).toBeTruthy();
  const response = await request.get(new URL(href!, baseURL).href);
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  const scope = new URL(baseURL!).pathname;
  expect(manifest).toMatchObject({
    id: scope,
    scope,
    start_url: `${scope}plan`,
    display: "standalone",
    lang: "ko",
  });
  for (const icon of manifest.icons) {
    expect(icon.src.startsWith(scope)).toBe(true);
    const image = await request.get(new URL(icon.src, baseURL).href);
    expect(image.headers()["content-type"]).toContain("image/png");
    const bytes = await image.body();
    const size = Number(icon.sizes.split("x")[0]);
    expect(bytes.readUInt32BE(16)).toBe(size);
    expect(bytes.readUInt32BE(20)).toBe(size);
  }
  expect(
    manifest.icons.some(
      (icon: { purpose: string }) => icon.purpose === "maskable",
    ),
  ).toBe(true);
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
    "content",
    "#2f6b50",
  );
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
    "href",
    `${scope}pwa/apple-touch-icon.png`,
  );
  await waitForWorker(page);
  const worker = await request.get("sw.js");
  expect(worker.headers()["cache-control"]).toContain("no-store");
  expect(worker.headers()["service-worker-allowed"]).toBe(scope);
  expect(
    await page.evaluate(
      async () => (await navigator.serviceWorker.ready).scope,
    ),
  ).toBe(baseURL);
});

test("installation offers accessible guidance, handles prompt choices and hides in standalone", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.addEventListener(
      "beforeinstallprompt",
      (event) => {
        if (event.isTrusted) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      },
      true,
    );
  });
  await page.goto("./");
  const trigger = page.getByRole("button", { name: "PawProof 앱 설치 안내" });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading")).toHaveText(
    "여행 노트를 홈 화면에.",
  );
  await expect(dialog).toContainText("인터넷 연결이 필요해요");
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  for (const outcome of ["dismissed", "accepted"] as const) {
    await page.evaluate((choice) => {
      const event = new Event("beforeinstallprompt", { cancelable: true });
      Object.assign(event, {
        prompt: async () => {},
        userChoice: Promise.resolve({ outcome: choice }),
      });
      window.dispatchEvent(event);
    }, outcome);
    await trigger.click();
    await dialog.getByRole("button", { name: "PawProof 설치하기" }).click();
    await expect(dialog.getByRole("status")).toContainText(
      outcome === "dismissed" ? "설치를 취소" : "설치 요청을 보냈어요",
    );
    await page.keyboard.press("Escape");
  }
  await page.evaluate(() => window.dispatchEvent(new Event("appinstalled")));
  await trigger.click();
  await expect(dialog.getByRole("status")).toContainText(
    "홈 화면에 추가했어요",
  );
  await page.keyboard.press("Escape");
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "standalone", { value: true }),
  );
  await page.reload();
  await expect(trigger).toHaveCount(0);
});

test("offline keeps edits, blocks API work and falls back without caching private data", async ({
  page,
  context,
  baseURL,
}, info) => {
  let verifications = 0;
  page.on("request", (request) => {
    if (request.url().endsWith("/api/verify")) verifications++;
  });
  await page.goto("plan?mode=demo");
  await waitForWorker(page);
  await page
    .getByRole("button", { name: "이 코스 검사하기", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "코스 확인 결과" }),
  ).toBeVisible();
  await page.getByLabel("반려견 1 이름").fill("오프라인 두부");
  await context.setOffline(true);
  await expect(
    page.getByRole("status").filter({ hasText: "지금은 오프라인" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "코스 다시 검사하기", exact: true })
    .click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "오프라인에서는",
  );
  expect(verifications).toBe(1);
  await expect(page.getByLabel("반려견 1 이름")).toHaveValue("오프라인 두부");
  await page
    .getByRole("button", { name: "이 기기에 저장", exact: true })
    .click();
  await page.goto(new URL("about", baseURL).href);
  await expect(
    page.getByRole("heading", { name: "연결을 기다리고 있어요." }),
  ).toBeVisible();
  expect(
    await page.evaluate(async () => {
      await document.fonts.ready;
      return (
        await document.fonts.load(
          "16px PawProofOffline",
          "연결을 기다리고 있어요",
        )
      ).length;
    }),
  ).toBeGreaterThan(0);
  await page.screenshot({
    path: info.outputPath("offline.png"),
    fullPage: true,
  });
  const cached = await page.evaluate(async () => {
    const names = await caches.keys();
    return Promise.all(
      names.map(async (name) =>
        (await (await caches.open(name)).keys()).map(
          (request) => new URL(request.url).pathname,
        ),
      ),
    );
  });
  expect(cached.flat().sort()).toEqual(
    [
      "offline",
      "pwa/icon-192.png",
      "pwa/icon-512.png",
      "pwa/icon-maskable-512.png",
      "pwa/apple-touch-icon.png",
    ]
      .map((path) => new URL(path, baseURL).pathname)
      .sort(),
  );
  const apiAvailable = await page.evaluate(
    async (url) =>
      fetch(url)
        .then(() => true)
        .catch(() => false),
    new URL("api/health", baseURL).href,
  );
  expect(apiAvailable).toBe(false);
  await context.setOffline(false);
  await page.getByRole("link", { name: "여행 노트 다시 열기" }).click();
  await page.getByRole("button", { name: "불러오기", exact: true }).click();
  await expect(page.getByLabel("반려견 1 이름")).toHaveValue("오프라인 두부");
  expect(verifications).toBe(1);
});

test("worker update waits for consent, cleans only its caches and preserves another tab", async ({
  page,
  context,
  baseURL,
}) => {
  const proxy = await startPwaUpdateProxy(baseURL!);
  try {
    await page.goto(new URL("plan?mode=demo", proxy.url).href);
    await waitForWorker(page);
    await page.getByLabel("반려견 1 이름").fill("저장 전 입력");
    const other = await context.newPage();
    await other.goto(new URL("plan?mode=demo", proxy.url).href);
    await waitForWorker(other);
    await other.getByLabel("반려견 1 이름").fill("다른 탭의 입력");
    await page.evaluate(async () => {
      await caches.open("unrelated-app-cache");
    });
    proxy.releaseNext();
    await page.evaluate(async () => {
      await (await navigator.serviceWorker.ready).update();
    });
    await page
      .getByRole("button", { name: "업데이트 안내", exact: true })
      .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("저장하지 않은 입력은 사라질 수 있어요");
    await dialog.getByRole("button", { name: "계속 편집하기" }).click();
    await expect(page.getByLabel("반려견 1 이름")).toHaveValue("저장 전 입력");
    await page
      .getByRole("button", { name: "업데이트 안내", exact: true })
      .click();
    await Promise.all([
      page.waitForEvent("load"),
      dialog.getByRole("button", { name: "새 버전으로 열기" }).click(),
    ]);
    await expect(page.getByLabel("반려견 1 이름")).toHaveValue("두부");
    await expect(other.getByLabel("반려견 1 이름")).toHaveValue(
      "다른 탭의 입력",
    );
    const names = await page.evaluate(() => caches.keys());
    expect(names).toContain("unrelated-app-cache");
    const own = names.filter((name) => name.startsWith("pawproof-pwa:"));
    expect(own).toHaveLength(1);
    expect(own[0]).toContain("test-new");
    await other.close();
  } finally {
    await proxy.close();
  }
});
