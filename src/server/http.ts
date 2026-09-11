import "server-only";
import { z } from "zod";
import { readJson, ProviderError } from "../infrastructure/http/fetch-json.ts";
import { SetupRequired } from "./providers.ts";
export function json(value: unknown, status = 200) {
  return Response.json(value, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
export async function inputJson(request: Request): Promise<unknown> {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new z.ZodError([]);
  if (request.headers.get("sec-fetch-site") === "cross-site")
    throw new z.ZodError([]);
  try {
    return await readJson(request.body, 24_000);
  } catch {
    throw new z.ZodError([]);
  }
}
export function errorResponse(error: unknown): Response {
  if (error instanceof SetupRequired)
    return json({ error: error.message, code: "SETUP_REQUIRED" }, 503);
  if (error instanceof z.ZodError)
    return json(
      {
        error:
          "입력값을 확인해 주세요. 반려견 정보와 서로 다른 방문지 3~5곳이 필요해요.",
        code: "INVALID_INPUT",
      },
      400,
    );
  if (error instanceof ProviderError)
    return json(
      {
        error: "외부 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
        code: "PROVIDER_UNAVAILABLE",
      },
      502,
    );
  return json(
    {
      error: "검사를 완료하지 못했어요. 입력을 확인하고 다시 시도해 주세요.",
      code: "VERIFICATION_FAILED",
    },
    500,
  );
}
