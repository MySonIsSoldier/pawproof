import { z } from "zod";
import { apiPath } from "../../config/public";
import { withRequestSignal } from "../../lib/http/request-signal";
export async function accountRequest<T>(
  path: string,
  schema: z.ZodType<T>,
  token: string,
  method = "GET",
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  if (!navigator.onLine)
    throw new Error(
      "오프라인에서는 계정 노트를 사용할 수 없어요. 이 기기에 저장을 이용해 주세요.",
    );
  return withRequestSignal(30_000, signal, async (requestSignal) => {
    const response = await fetch(apiPath(path), {
      method,
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: requestSignal,
    });
    const result: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const parsed = z.object({ error: z.string() }).safeParse(result);
      throw new Error(
        parsed.success
          ? parsed.data.error
          : "계정 노트를 처리하지 못했어요. 잠시 후 다시 시도해 주세요.",
      );
    }
    const parsed = schema.safeParse(result);
    if (!parsed.success)
      throw new Error("저장된 노트의 형식을 확인할 수 없어요.");
    return parsed.data;
  });
}
