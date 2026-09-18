const DEFAULT_SITE_ORIGIN = "https://pawproof.kr";

/** Resolve the public origin used by canonical URLs and crawler metadata. */
export function resolveSiteOrigin(
  env: Record<string, string | undefined> = process.env,
): string {
  const candidate = env.APP_ORIGIN?.trim() || DEFAULT_SITE_ORIGIN;
  try {
    return new URL(candidate).origin;
  } catch {
    return DEFAULT_SITE_ORIGIN;
  }
}

export const siteOrigin = resolveSiteOrigin();
