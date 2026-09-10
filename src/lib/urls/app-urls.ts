import { parseBasePath, pathnameOf } from "./path.ts";
import { parseOrigin } from "./origin.ts";

export function createAppUrls(basePath: string) {
  const base = parseBasePath(basePath);

  function internalPath(path: string): string {
    const pathname = pathnameOf(path);
    if (base && (pathname === base || pathname.startsWith(`${base}/`))) {
      throw new Error("Pass a logical path without APP_BASE_PATH.");
    }
    return `${base}${path}`;
  }

  return {
    apiPath(path: string): string {
      const pathname = pathnameOf(path);
      if (pathname !== "/api" && !pathname.startsWith("/api/")) {
        throw new Error("apiPath expects a path under /api.");
      }
      return internalPath(path);
    },
    publicAssetPath(path: string): string {
      const pathname = pathnameOf(path);
      if (/^\/(api|_next)(\/|$)/u.test(pathname) || pathname === "/") {
        throw new Error("publicAssetPath expects a file from public/.");
      }
      return internalPath(path);
    },
    absoluteAppUrl(path: string, origin: string): string {
      return `${parseOrigin(origin)}${internalPath(path)}`;
    },
  };
}
