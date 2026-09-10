export function parseOrigin(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("APP_ORIGIN must be an absolute HTTP(S) origin.");
  }

  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username || url.password || url.pathname !== "/" || url.search || url.hash ||
    !/^https?:\/\/[^/?#\\\s]+\/?$/u.test(value)
  ) {
    throw new Error("APP_ORIGIN must contain only an HTTP(S) scheme and host, without credentials or a path.");
  }
  return url.origin;
}
