import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { startPreview, stopPreview } from "./preview.mjs";
const env = { ...process.env, CI: "true", NEXT_TELEMETRY_DISABLED: "1" };
// Local fallback only; elsewhere put Java 21+ on PATH.
if (existsSync("/tmp/pawproof-jre21/bin/java"))
  env.PATH = `/tmp/pawproof-jre21/bin:${env.PATH}`;
if (!env.PLAYWRIGHT_BROWSERS_PATH && existsSync("/tmp/ms-playwright"))
  env.PLAYWRIGHT_BROWSERS_PATH = "/tmp/ms-playwright";
if (existsSync("/tmp/pawproof-browser-libs/usr/lib/aarch64-linux-gnu"))
  env.LD_LIBRARY_PATH = [
    "/tmp/pawproof-browser-libs/usr/lib/aarch64-linux-gnu",
    env.LD_LIBRARY_PATH,
  ]
    .filter(Boolean)
    .join(":");
const quote = (value) => "'" + value.replaceAll("'", "'\"'\"'") + "'";
const command = [
  "pnpm",
  "exec",
  "playwright",
  "test",
  "-c",
  "playwright.firebase.config.ts",
  ...process.argv.slice(2),
]
  .map(quote)
  .join(" ");
const resume = await stopPreview();
try {
  const code = await new Promise((resolve, reject) => {
    const child = spawn(
      "pnpm",
      [
        "exec",
        "firebase",
        "emulators:exec",
        "--project",
        "demo-pawproof",
        "--only",
        "auth,firestore",
        command,
      ],
      { env, stdio: "inherit" },
    );
    child.once("error", reject);
    child.once("exit", resolve);
  });
  process.exitCode = code ?? 1;
} finally {
  if (resume) await startPreview();
}
