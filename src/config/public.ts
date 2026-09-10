import { createAppUrls } from "../lib/urls/app-urls.ts";

// A literal reference lets Next.js inline this one allowlisted build-time value.
export const { apiPath, publicAssetPath, absoluteAppUrl } = createAppUrls(
  process.env.NEXT_PUBLIC_APP_BASE_PATH ?? "",
);
