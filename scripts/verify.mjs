import { spawn } from "node:child_process";
import { access, mkdir, mkdtemp, writeFile, open } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { stopPreview, startPreview } from "./preview.mjs";
const env = {
  ...process.env,
  NEXT_TELEMETRY_DISABLED: "1",
  LIVE_SERVICES_ENABLED: "false",
  NEXT_PUBLIC_FIREBASE_API_KEY: "",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "",
  NEXT_PUBLIC_FIREBASE_APP_ID: "",
  NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL: "",
  FIREBASE_AUTH_EMULATOR_HOST: "",
  FIRESTORE_EMULATOR_HOST: "",
};
async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
// Reuse the browser installation available in this OCI container, without requiring it elsewhere.
if (!env.PLAYWRIGHT_BROWSERS_PATH && (await exists("/tmp/ms-playwright")))
  env.PLAYWRIGHT_BROWSERS_PATH = "/tmp/ms-playwright";
if (await exists("/tmp/pawproof-browser-libs/usr/lib/aarch64-linux-gnu"))
  env.LD_LIBRARY_PATH = [
    "/tmp/pawproof-browser-libs/usr/lib/aarch64-linux-gnu",
    env.LD_LIBRARY_PATH,
  ]
    .filter(Boolean)
    .join(":");
function run(args, extra = {}) {
  console.log(`\nVerifying: pnpm ${args.join(" ")}`);
  return new Promise((resolve, reject) => {
    const child = spawn("pnpm", args, {
      stdio: "inherit",
      env: { ...env, ...extra },
    });
    child.once("error", reject);
    child.once("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`Verification failed: ${args.join(" ")}`)),
    );
  });
}
async function startLocalProxy() {
  const binary = "/app/code-server/bin/code-server";
  if (!(await exists(binary))) {
    console.log(
      "No local code-server binary; proxy mode will test the Next basePath directly.",
    );
    return null;
  }
  const directory = await mkdtemp(join(tmpdir(), "pawproof-e2e-proxy-"));
  await writeFile(
    join(directory, "config.yaml"),
    "bind-addr: 127.0.0.1:8444\nauth: none\ncert: false\n",
  );
  await mkdir(".cache", { recursive: true });
  const log = await open(".cache/e2e-proxy.log", "w");
  const proxyEnv = { ...env };
  delete proxyEnv.VSCODE_IPC_HOOK_CLI;
  const child = spawn(
    binary,
    [
      "--config",
      join(directory, "config.yaml"),
      "--user-data-dir",
      join(directory, "data"),
      "--extensions-dir",
      join(directory, "extensions"),
      "--disable-telemetry",
      "--disable-update-check",
    ],
    { env: proxyEnv, stdio: ["ignore", log.fd, log.fd] },
  );
  await new Promise((resolve, reject) => {
    child.once("spawn", resolve);
    child.once("error", reject);
  });
  await log.close();
  for (let i = 0; i < 40; i++) {
    if (child.exitCode !== null)
      throw new Error("Test proxy exited; see .cache/e2e-proxy.log.");
    try {
      const response = await fetch("http://127.0.0.1:8444/healthz", {
        signal: AbortSignal.timeout(1000),
      });
      if (response.ok) return child;
    } catch {
      /* Wait for this locally launched proxy. */
    }
    await delay(250);
  }
  child.kill("SIGTERM");
  throw new Error("Test proxy did not become ready.");
}
let resume = false;
let proxy;
try {
  resume = await stopPreview();
  await run(["test"]);
  await run(["lint"]);
  await run(["typecheck"]);
  await run(["test:e2e"], { E2E_MODE: "direct", E2E_ORIGIN: "" });
  proxy = await startLocalProxy();
  await run(["test:e2e"], {
    E2E_MODE: "proxy",
    E2E_ORIGIN: proxy ? "http://127.0.0.1:8444" : "",
  });
  proxy?.kill("SIGTERM");
  proxy = null;
  await run(["build"], { APP_ENV: "production", APP_BASE_PATH: "" });
  await run(["test:e2e"], { E2E_MODE: "production", E2E_ORIGIN: "" });
  console.log(
    "\nAll checks passed. Reports: playwright-report/{direct,proxy,production}; screenshots: test-results/.",
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  proxy?.kill("SIGTERM");
  if (resume) await startPreview();
}
