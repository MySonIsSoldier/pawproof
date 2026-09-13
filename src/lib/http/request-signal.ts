// AbortSignal.any/timeout are newer than our supported browsers.
// Keep the scope alive until the response body has also been consumed.
export async function withRequestSignal<T>(
  timeoutMs: number,
  source: AbortSignal | undefined,
  request: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const controller = new AbortController();
  const cancel = () => controller.abort(source?.reason);
  const timer = setTimeout(
    () =>
      controller.abort(new DOMException("Request timed out", "TimeoutError")),
    timeoutMs,
  );
  if (source?.aborted) cancel();
  else source?.addEventListener("abort", cancel, { once: true });

  try {
    return await request(controller.signal);
  } finally {
    clearTimeout(timer);
    source?.removeEventListener("abort", cancel);
  }
}
