import { nearbyQuerySchema } from "../../../../application/contracts/discovery";
import { createProviders } from "../../../../server/providers";
import { errorResponse, json, rateLimitResponse } from "../../../../server/http";
import {
  checkRateLimit,
  publicRateLimits,
} from "../../../../server/rate-limit";
export async function GET(request: Request) {
  const limit = checkRateLimit(request, "nearby", publicRateLimits.nearby);
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds);
  const parsed = nearbyQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!parsed.success)
    return json({ error: "국내 지도 위치와 검색 반경을 확인해 주세요." }, 400);
  try {
    const { lat, lng, radius, category } = parsed.data;
    const source = createProviders("live", true).places;
    if (!source.around) throw new Error("Nearby search unavailable");
    return json({
      places: await source.around({ lat, lng }, radius, category),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
