import { z } from "zod";
import { createProviders } from "../../../server/providers";
import { errorResponse, json } from "../../../server/http";
const querySchema = z.object({
  mode: z.enum(["demo", "live"]),
  q: z.string().trim().max(60),
  category: z.enum(["관광지", "식당", "카페"]).optional(),
});
export async function GET(request: Request) {
  try {
    const { mode, q, category } = querySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    if (mode === "live" && !q) return json({ places: [] });
    return json({
      places: await createProviders(mode, true).places.search(q, category),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
