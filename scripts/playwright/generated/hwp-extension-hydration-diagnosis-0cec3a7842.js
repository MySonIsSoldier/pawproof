import { chromium, expect } from "@playwright/test";

// Existing development server only; no provider API or source mutation.
const address = process.argv[2];
if (!address)
  throw new Error("Pass the development base URL, including trailing slash.");
const baseURL = new URL(address);
if (!baseURL.pathname.endsWith("/"))
  throw new Error("Base URL must end with /.");
const hydrationPattern =
  /hydration|hydrated|server rendered HTML|server-rendered HTML/i;

async function inspect(browser, injected, path) {
  const context = await browser.newContext({
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
  });
  try {
    if (injected) {
      await context.addInitScript(() => {
        // Emulate document-start extension changes, before React hydrates.
        const inject = () => {
          if (!document.documentElement) return false;
          document.documentElement.setAttribute("data-hwp-extension", "rhwp");
          document.documentElement.setAttribute(
            "data-hwp-extension-version",
            "0.8.6",
          );
          return true;
        };
        if (!inject()) {
          const observer = new MutationObserver(() => {
            if (inject()) observer.disconnect();
          });
          observer.observe(document, { childList: true });
        }
      });
    }
    const page = await context.newPage();
    const warnings = [];
    const exceptions = [];
    page.on("console", (message) => {
      if (message.type() === "error" && hydrationPattern.test(message.text()))
        warnings.push(message.text());
    });
    page.on("pageerror", (error) => exceptions.push(error.message));
    const response = await page.goto(new URL(path, baseURL).href, {
      waitUntil: "networkidle",
    });
    expect(response.status()).toBe(200);
    // Compare original server HTML with the mutated browser DOM.
    expect(await response.text()).not.toContain("data-hwp-extension");
    expect(await page.locator("html").getAttribute("data-hwp-extension")).toBe(
      injected ? "rhwp" : null,
    );
    if (path.startsWith("plan")) {
      // A client state update proves interactivity without calling provider APIs.
      await page.getByRole("button", { name: "함께 가는 반려견 추가" }).click();
      await expect(page.getByLabel("반려견 2 이름")).toBeVisible();
    } else {
      await page.getByRole("link", { name: "가상 코스로 체험하기" }).click();
      await expect(page).toHaveURL(/\/plan\?mode=demo$/);
    }
    if (injected) {
      await expect.poll(() => warnings.length).toBeGreaterThan(0);
      expect(warnings.join("\n")).toContain("data-hwp-extension-version");
    } else {
      expect(warnings).toEqual([]);
    }
    expect(exceptions).toEqual([]);
    return {
      path,
      injected,
      hydrationWarnings: warnings.length,
      pageExceptions: exceptions.length,
    };
  } finally {
    await context.close();
  }
}

const browser = await chromium.launch({ headless: true });
try {
  for (const path of ["./", "plan?mode=demo"]) {
    for (const injected of [false, true]) {
      console.log(JSON.stringify(await inspect(browser, injected, path)));
    }
  }
} finally {
  await browser.close();
}
