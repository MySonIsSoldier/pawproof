import type { z } from "zod";
import { apiPath } from "../../config/public";
export async function callApi<T>(
  path: string,
  schema: z.ZodType<T>,
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(apiPath(path), {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: signal
      ? AbortSignal.any([signal, AbortSignal.timeout(290_000)])
      : AbortSignal.timeout(290_000),
  });
  const value: unknown = await response.json();
  if (!response.ok) {
    const message =
      value &&
      typeof value === "object" &&
      "error" in value &&
      typeof value.error === "string"
        ? value.error
        : "요청을 완료하지 못했어요.";
    throw new Error(message);
  }
  const parsed = schema.safeParse(value);
  if (!parsed.success)
    throw new Error(
      "받은 결과의 형식이 올바르지 않아요. 잠시 후 다시 검사해 주세요.",
    );
  return parsed.data;
}
