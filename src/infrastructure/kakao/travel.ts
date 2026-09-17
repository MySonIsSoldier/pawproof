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
const walkingResponseSchema = z.object({
  status: z.string(),
  route: z
    .object({
      properties: z.object({
        totalTime: z.number().finite().nonnegative().max(86400),
      }),
    })
    .nullable(),
});
export function kakaoTravel(
  apiKey: string,
  fetcher: typeof fetch = fetch,
): RouteTimeProvider {
  async function routeMinutes(
    url: URL,
    fetchOptions: RequestInit = {},
  ): Promise<number | null> {
    const data = responseSchema.parse(
      await fetchJson(
        url,
        {
          ...fetchOptions,
          headers: {
            Authorization: `KakaoAK ${apiKey}`,
            ...(fetchOptions.headers || {}),
          },
        },
        fetcher,
      ),
    );
    const route = data.routes.find((item) => item.result_code === 0);
    return route?.summary ? Math.ceil(route.summary.duration / 60) : null;
  }
  async function walkingRouteMinutes(url: URL): Promise<number | null> {
    const data = walkingResponseSchema.parse(
      await fetchJson(
        url,
        { headers: { Authorization: `KakaoAK ${apiKey}` } },
        fetcher,
      ),
    );
    return data.route ? Math.ceil(data.route.properties.totalTime / 60) : null;
  }
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
      return routeMinutes(url);
    },
    walkingMinutes: async (from, to) => {
      if (!from.lat || !from.lng || !to.lat || !to.lng) return null;
      const url = new URL("https://dapi.kakao.com/v2/routing/walk");
      url.search = new URLSearchParams({
        start_x: String(from.lng),
        start_y: String(from.lat),
        end_x: String(to.lng),
        end_y: String(to.lat),
      }).toString();
      return walkingRouteMinutes(url);
    },
  };
}
