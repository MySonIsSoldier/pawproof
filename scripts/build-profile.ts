import type { AppConfig } from "../src/config/app-config.ts";

export function createBuildProfile(config: AppConfig) {
  return { version: 1, appEnv: config.appEnv, basePath: config.basePath };
}

export function assertBuildProfile(profile: unknown, config: AppConfig): void {
  if (
    !profile || typeof profile !== "object" ||
    !("version" in profile) || profile.version !== 1 ||
    !("appEnv" in profile) || profile.appEnv !== config.appEnv ||
    !("basePath" in profile) || profile.basePath !== config.basePath
  ) {
    throw new Error("Build profile does not match this environment. Run pnpm build with the intended APP_ENV and APP_BASE_PATH.");
  }
}
