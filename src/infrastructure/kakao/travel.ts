import { z } from "zod";
import type { RouteTimeProvider } from "../../application/ports/providers.ts";
import { fetchJson } from "../http/fetch-json.ts";
const responseSchema = z.object({
  routes: z.array(
    z.object({
      result_code: z.number(),
      summary: z
        .object({ duration: z.number().finite().nonnegative().max(86400) })
        .optional(),
    }),
  ),
});
export function kakaoTravel(
  apiKey: string,
  fetcher: typeof fetch = fetch,
): RouteTimeProvider {
  return {
    basis: "kakao",
    minutes: async (from, to) => {
      if (!from.lat || !from.lng || !to.lat || !to.lng) return null;
      const url = new URL("https://apis-navi.kakaomobility.com/v1/directions");
      url.search = new URLSearchParams({
        origin: `${from.lng},${from.lat}`,
        destination: `${to.lng},${to.lat}`,
        summary: "true",
        priority: "RECOMMEND",
      }).toString();
      const data = responseSchema.parse(
        await fetchJson(
          url,
          { headers: { Authorization: `KakaoAK ${apiKey}` } },
          fetcher,
        ),
      );
      const route = data.routes.find((r) => r.result_code === 0);
      return route?.summary ? Math.ceil(route.summary.duration / 60) : null;
    },
  };
}
