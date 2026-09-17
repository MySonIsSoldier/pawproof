import { densityQuerySchema } from "../../../../application/contracts/discovery";
import { densestCenter } from "../../../../application/places/density";
import { createProviders } from "../../../../server/providers";
import { errorResponse, json } from "../../../../server/http";
import type { Place } from "../../../../domain/policies/types";

const candidateAreas = ["고양", "파주", "양주", "인천"] as const;

export async function GET(request: Request) {
  const parsed = densityQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!parsed.success)
    return json({ error: "검색 반경을 확인해 주세요." }, 400);
  try {
    const source = createProviders("live", true).places;
    if (!source.around) throw new Error("Nearby search unavailable");
    const regions: Array<{ area: string; places: Place[] }> = [];
    for (const area of candidateAreas) {
      try {
        regions.push({ area, places: await source.search(area) });
      } catch {
        // A single regional response must not prevent the remaining regions
        // from supplying the initial map center.
      }
    }
    const densities = [] as Array<{
      area: string;
      center: { lat: number; lng: number };
      count: number;
    }>;
    for (const region of regions) {
      const dense = densestCenter(region.places, parsed.data.radius);
      if (!dense) continue;
      try {
        const nearby = await source.around(
          dense.center,
          parsed.data.radius,
        );
        densities.push({
          area: region.area,
          center: dense.center,
          count: nearby.length,
        });
      } catch {
        // Keep the search density as a fallback when the coordinate lookup
        // is temporarily unavailable for this one region.
        densities.push({
          area: region.area,
          center: dense.center,
          count: dense.count,
        });
      }
    }
    const best = densities.reduce<{
      area: string;
      center: { lat: number; lng: number };
      count: number;
    } | null>((current, density) =>
      !current || density.count > current.count ? density : current,
    null);
    if (!best)
      return json({ error: "장소가 등록된 지역을 찾지 못했어요." }, 404);
    return json({
      center: best.center,
      area: `${best.area} 주변 후보가 많은 지역`,
      count: best.count,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
