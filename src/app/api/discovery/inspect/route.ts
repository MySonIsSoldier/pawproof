import { inspectInputSchema } from "../../../../application/contracts/discovery";
import { inspectPlaces } from "../../../../application/use-cases/inspect-places";
import { createProviders } from "../../../../server/providers";
import { errorResponse, inputJson, json, rateLimitResponse } from "../../../../server/http";
import { withFunctionBudget } from "../../../../server/function-budget";
import {
  checkRateLimit,
  publicRateLimits,
} from "../../../../server/rate-limit";
export const maxDuration = 180;
export async function POST(request: Request) {
  try {
    const limit = checkRateLimit(request, "inspect", publicRateLimits.inspect);
    if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds);
    const parsed = inspectInputSchema.safeParse(await inputJson(request));
    if (!parsed.success)
      return json({ error: "서로 다른 장소 1~5곳을 선택해 주세요." }, 400);
    return json(
      await withFunctionBudget(
        () => inspectPlaces(parsed.data.ids, createProviders("live")),
        170_000,
      ),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
