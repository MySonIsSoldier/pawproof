import { tripSchema } from "../../../application/contracts/trip";
import { verifyTrip } from "../../../application/use-cases/verify-trip";
import { createProviders } from "../../../server/providers";
import { errorResponse, inputJson, json, rateLimitResponse } from "../../../server/http";
import { withFunctionBudget } from "../../../server/function-budget";
import {
  checkRateLimit,
  publicRateLimits,
} from "../../../server/rate-limit";
export const maxDuration = 180;
export async function POST(request: Request) {
  try {
    const limit = checkRateLimit(request, "verify", publicRateLimits.verify);
    if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds);
    const input = tripSchema.parse(await inputJson(request));
    return json(
      await withFunctionBudget(
        () => verifyTrip(input, createProviders(input.mode)),
        170_000,
      ),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
