import { defineConfig, devices } from "@playwright/test";

const mode = process.env.E2E_MODE || "direct";
if (!["direct", "proxy", "production"].includes(mode)) throw new Error("Invalid E2E_MODE.");
const port = mode === "proxy" ? 3101 : mode === "production" ? 3102 : 3100;
const basePath = mode === "proxy" ? `/absproxy/${port}` : "";
const upstream = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  timeout: 45_000,
  expect: { timeout: 15_000 },
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: `${process.env.E2E_ORIGIN || upstream}${basePath}/`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: mode === "production" ? "node scripts/next.ts start" : `node scripts/next.ts dev ${mode === "proxy" ? "code-server" : "local"}`,
    url: `${upstream}${basePath}/api/health`,
    reuseExistingServer: false,
    timeout: 90_000,
    env: {
      APP_ENV: mode === "proxy" ? "code-server" : mode === "production" ? "production" : "local",
      APP_BASE_PATH: basePath,
      APP_ORIGIN: process.env.E2E_ORIGIN || upstream,
      DEV_ALLOWED_HOSTS: "127.0.0.1,localhost",
      PORT: String(port),
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
});
