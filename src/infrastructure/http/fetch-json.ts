export class ProviderError extends Error {
  readonly code: "unavailable" | "timeout" | "invalid" | "limit";
  constructor(code: "unavailable" | "timeout" | "invalid" | "limit") {
    super(`Provider ${code}`);
    this.code = code;
  }
}
export async function readJson(
  body: ReadableStream<Uint8Array> | null,
  maxBytes = 1_000_000,
): Promise<unknown> {
  if (!body) throw new ProviderError("invalid");
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > maxBytes) {
        await reader.cancel();
        throw new ProviderError("limit");
      }
      chunks.push(value);
    }
    const joined = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      joined.set(chunk, offset);
      offset += chunk.length;
    }
    return JSON.parse(new TextDecoder().decode(joined));
  } catch (error) {
    if (error instanceof ProviderError) throw error;
    throw new ProviderError("invalid");
  } finally {
    reader.releaseLock();
  }
}
export async function fetchJson(
  url: URL | string,
  init: RequestInit = {},
  fetcher: typeof fetch = fetch,
  timeoutMs = 15_000,
): Promise<unknown> {
  try {
    const response = await fetcher(url, {
      ...init,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) {
      await response.body?.cancel();
      throw new ProviderError(
        response.status === 429 ? "limit" : "unavailable",
      );
    }
    return await readJson(response.body);
  } catch (error) {
    if (error instanceof ProviderError) throw error;
    throw new ProviderError(
      error instanceof Error && /Timeout|Abort/.test(error.name)
        ? "timeout"
        : "unavailable",
    );
  }
}
