import { recoverySchema } from "../../../application/contracts/trip";
import { recoverTrip } from "../../../application/use-cases/recover-trip";
import { createProviders } from "../../../server/providers";
import { errorResponse, inputJson, json, rateLimitResponse } from "../../../server/http";
import { withFunctionBudget } from "../../../server/function-budget";
import {
  checkRateLimit,
  publicRateLimits,
} from "../../../server/rate-limit";
export const maxDuration = 300;
export async function POST(request: Request) {
  try {
    const limit = checkRateLimit(request, "recover", publicRateLimits.recover);
    if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds);
    const { trip, index } = recoverySchema.parse(await inputJson(request));
    return json(
      await withFunctionBudget(
        () => recoverTrip(trip, index, createProviders(trip.mode)),
        290_000,
      ),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
