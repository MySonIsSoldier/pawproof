import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";
import { resolveAppConfig } from "./src/config/app-config.ts";

export default function nextConfig(phase: string): NextConfig {
  const config = resolveAppConfig(process.env, phase === PHASE_DEVELOPMENT_SERVER ? "development" : "production");
  return {
    poweredByHeader: false,
    basePath: config.basePath,
    allowedDevOrigins: [...config.allowedDevOrigins],
    env: { NEXT_PUBLIC_APP_BASE_PATH: config.basePath },
  };
}
