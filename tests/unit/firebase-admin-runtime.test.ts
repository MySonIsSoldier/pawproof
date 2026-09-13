import { test } from "node:test";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

test("Firebase Admin loads and resolves signing keys with Vercel require(ESM) disabled", async () => {
  await promisify(execFile)(
    process.execPath,
    [
      "--no-experimental-require-module",
      fileURLToPath(
        new URL("../fixtures/firebase-admin-runtime.cjs", import.meta.url),
      ),
    ],
    { env: { NODE_ENV: "production" }, timeout: 15_000 },
  );
});
