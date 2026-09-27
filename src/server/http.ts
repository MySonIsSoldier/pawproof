import "server-only";
import { z } from "zod";
import { readJson, ProviderError } from "../infrastructure/http/fetch-json.ts";
import { SetupRequired } from "./providers.ts";
export function json(
  value: unknown,
  status = 200,
  headers: HeadersInit = {},
) {
  return Response.json(value, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
  });
}
export function rateLimitResponse(retryAfterSeconds: number) {
  return json(
    {
      error: "요청이 잠시 많아요. 잠시 후 다시 시도해 주세요.",
      code: "RATE_LIMITED",
    },
    429,
    { "Retry-After": String(retryAfterSeconds) },
  );
}
export async function inputJson(
  request: Request,
  maxBytes = 24_000,
): Promise<unknown> {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new z.ZodError([]);
  if (request.headers.get("sec-fetch-site") === "cross-site")
    throw new z.ZodError([]);
  try {
    return await readJson(request.body, maxBytes);
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
          "입력값을 확인해 주세요. 반려견 정보와 서로 다른 방문지 1~5곳이 필요해요.",
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
  if (error instanceof FunctionTimeoutError)
    return json(
      {
        error: "처리가 오래 걸리고 있어요. 잠시 후 다시 시도해 주세요.",
        code: "FUNCTION_TIMEOUT",
      },
      504,
    );
  return json(
    {
      error: "검사를 완료하지 못했어요. 입력을 확인하고 다시 시도해 주세요.",
      code: "VERIFICATION_FAILED",
    },
    500,
  );
}

export class FunctionTimeoutError extends Error {
  constructor() {
    super("Function execution budget exceeded");
    this.name = "FunctionTimeoutError";
  }
}
