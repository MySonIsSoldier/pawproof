import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";
import { resolveAppConfig } from "./src/config/app-config.ts";
import { pwaEnabled } from "./src/config/pwa.ts";

export default function nextConfig(phase: string): NextConfig {
  const config = resolveAppConfig(
    process.env,
    phase === PHASE_DEVELOPMENT_SERVER ? "development" : "production",
  );
  return {
    poweredByHeader: false,
    // This workspace switches root/proxy dev profiles; avoid restoring stale HMR compiler state.
    experimental: { turbopackFileSystemCacheForDev: false },
    basePath: config.basePath,
    allowedDevOrigins: [...config.allowedDevOrigins],
    env: {
      // Kakao JavaScript keys are public identifiers, unlike the Mobility REST key.
      NEXT_PUBLIC_KAKAO_MAP_KEY:
        process.env.NEXT_PUBLIC_KAKAO_MAP_KEY?.trim() ||
        process.env.KAKAO_MAP_KEY?.trim() ||
        "",
      NEXT_PUBLIC_APP_BASE_PATH: config.basePath,
      NEXT_PUBLIC_PWA_ENABLED: String(
        pwaEnabled(process.env.PWA_ENABLED, phase === PHASE_DEVELOPMENT_SERVER),
      ),
      NEXT_PUBLIC_PWA_RELEASE: process.env.PWA_RELEASE_ID || "development",
    },
  };
}
