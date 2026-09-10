import { spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import nextEnv from "@next/env";
import { resolveAppConfig } from "../src/config/app-config.ts";
import { assertBuildProfile, createBuildProfile } from "./build-profile.ts";

const require = createRequire(import.meta.url);

async function main(): Promise<number> {
  const [command, profile, ...extra] = process.argv.slice(2);
  if (!["dev", "build", "start", "typegen"].includes(command) || extra.length || (profile && (command !== "dev" || !["local", "code-server"].includes(profile)))) {
    throw new Error("Usage: node scripts/next.ts dev [local|code-server] | build | start | typegen. Set PORT through the environment.");
  }
  const development = command === "dev";
  Object.assign(process.env, { NODE_ENV: development ? "development" : "production" });
  nextEnv.loadEnvConfig(process.cwd(), development);
  if (profile) {
    process.env.APP_ENV = profile;
    process.env.APP_BASE_PATH = profile === "local" ? "" : process.env.APP_BASE_PATH || `/absproxy/${process.env.PORT || "3000"}`;
  }

  const config = resolveAppConfig(process.env, development ? "development" : "production");
  // Next's own config loader must receive the same resolved values as the launcher.
  process.env.APP_ENV = config.appEnv;
  process.env.APP_BASE_PATH = config.basePath;
  process.env.PORT = String(config.port);

  const buildProfileFile = new URL("../.next/pawproof-build.json", import.meta.url);
  if (command === "start") {
    let profile: unknown;
    try { profile = JSON.parse(await readFile(buildProfileFile, "utf8")); }
    catch { throw new Error("No valid PawProof build profile found. Run pnpm build before pnpm start."); }
    assertBuildProfile(profile, config);
  }

  const args = [require.resolve("next/dist/bin/next"), command];
  if (command === "dev" || command === "start") args.push("--hostname", "0.0.0.0", "--port", String(config.port));
  const child = spawn(process.execPath, args, { stdio: "inherit", env: process.env });
  const onInterrupt = () => child.kill("SIGINT");
  const onTerminate = () => child.kill("SIGTERM");
  process.once("SIGINT", onInterrupt);
  process.once("SIGTERM", onTerminate);
  const exitCode = await new Promise<number>((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => resolve(code ?? (signal === "SIGINT" ? 130 : 1)));
  });
  process.removeListener("SIGINT", onInterrupt);
  process.removeListener("SIGTERM", onTerminate);
  if (command === "build" && exitCode === 0) {
    await writeFile(buildProfileFile, `${JSON.stringify(createBuildProfile(config))}\n`);
  }
  return exitCode;
}

main().then((code) => { process.exitCode = code; }).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Unable to run Next.js.");
  process.exitCode = 1;
});
