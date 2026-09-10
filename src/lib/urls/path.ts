/** Validate a logical pathname before URL normalization can hide traversal. */
export function pathnameOf(path: string): string {
  if (!path.startsWith("/") || /[\\\u0000-\u0020\u007f]/u.test(path)) {
    throw new Error("An internal path must start with / and contain no whitespace or backslashes.");
  }

  const pathname = path.split(/[?#]/u, 1)[0];
  if (pathname.includes("//")) throw new Error("An internal path cannot contain //.");

  for (const segment of pathname.split("/")) {
    let decoded: string;
    try {
      decoded = decodeURIComponent(segment);
    } catch {
      throw new Error("An internal path contains invalid encoding.");
    }
    if (decoded === "." || decoded === ".." || /[%/\\?#\u0000-\u0020\u007f]/u.test(decoded)) {
      throw new Error("An internal path contains an unsafe segment.");
    }
  }
  return pathname;
}

export function parseBasePath(value = ""): string {
  if (value === "" || value === "/") return "";
  const pathname = pathnameOf(value);
  if (pathname !== value) throw new Error("APP_BASE_PATH cannot contain a query or fragment.");
  if (!/^\/[a-zA-Z0-9/_~.-]+$/u.test(pathname)) {
    throw new Error("APP_BASE_PATH must use plain ASCII path segments.");
  }
  return pathname.replace(/\/$/u, "");
}
