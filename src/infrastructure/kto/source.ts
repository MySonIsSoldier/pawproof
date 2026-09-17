import { z } from "zod";
import type { PlaceSource } from "../../application/ports/providers.ts";
import type { Category, Place } from "../../domain/policies/types.ts";
import { fetchJson, ProviderError } from "../http/fetch-json.ts";
import { findSearchRegion } from "../../application/places/regions.ts";
const row = z.record(z.string(), z.union([z.string(), z.number(), z.null()]));
const envelope = z.object({
  response: z.object({
    header: z.object({ resultCode: z.string() }),
    body: z
      .object({
        items: z
          .union([
            z.literal(""),
            z.object({ item: z.union([z.array(row), row]).optional() }),
          ])
          .optional(),
      })
      .optional(),
  }),
});
type Row = z.infer<typeof row>;
const text = (value: unknown) =>
  typeof value === "string" || typeof value === "number" ? String(value) : "";
const plain = (value: unknown) =>
  text(value)
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
const categoryOf = (item: Row): Category =>
  text(item.contenttypeid) === "39"
    ? (
        text(item.lclsSystm2)
          ? text(item.lclsSystm2) === "FD05"
          : text(item.cat3) === "A05020900"
      )
      ? "카페"
      : "식당"
    : "관광지";
export function parseKtoItems(value: unknown): Row[] {
  const parsed = envelope.parse(value).response;
  if (parsed.header.resultCode !== "0000")
    throw new ProviderError("unavailable");
  const items = parsed.body?.items;
  if (!items || !items.item) return [];
  return Array.isArray(items.item) ? items.item : [items.item];
}
function placeFrom(item: Row): Place {
  const id = text(item.contentid);
  if (!/^\d{1,12}$/.test(id) || !text(item.title))
    throw new ProviderError("invalid");
  const lat = Number(item.mapy),
    lng = Number(item.mapx);
  return {
    id,
    name: plain(item.title),
    category: categoryOf(item),
    address: [plain(item.addr1), plain(item.addr2)].filter(Boolean).join(" "),
    lat: Number.isFinite(lat) ? lat : 0,
    lng: Number.isFinite(lng) ? lng : 0,
    source: "kto",
  };
}
export function ktoSource(
  serviceKey: string,
  fetcher: typeof fetch = fetch,
): PlaceSource {
  const request = async (operation: string, params: Record<string, string>) => {
    const url = new URL(
      `https://apis.data.go.kr/B551011/KorPetTourService2/${operation}`,
    );
    // URLSearchParams performs the one required encoding; users configure the decoding key.
    url.search = new URLSearchParams({
      serviceKey,
      MobileOS: "ETC",
      MobileApp: "PawProof",
      _type: "json",
      numOfRows: "20",
      pageNo: "1",
      ...params,
    }).toString();
    return parseKtoItems(await fetchJson(url, {}, fetcher));
  };
  const supported = (items: Row[]) =>
    items
      .filter((item) =>
        ["12", "14", "28", "39"].includes(text(item.contenttypeid)),
      )
      .map(placeFrom);
  return {
    around: async (center, radius, category) => {
      const types =
        category === "카페" || category === "식당"
          ? ["39"]
          : category === "관광지"
            ? ["12", "14", "28"]
            : ["12", "14", "28", "39"];
      const found: Place[] = [];
      for (let i = 0; i < types.length; i += 2) {
        const batches = await Promise.all(
          types.slice(i, i + 2).map((contentTypeId) =>
            request("locationBasedList2", {
              mapX: String(center.lng),
              mapY: String(center.lat),
              radius: String(radius),
              arrange: "E",
              numOfRows: "30",
              contentTypeId,
            }),
          ),
        );
        found.push(...batches.flatMap(supported));
      }
      return [...new Map(found.map((p) => [p.id, p])).values()]
        .filter(
          (p) =>
            p.lat >= 32 &&
            p.lat <= 39.5 &&
            p.lng >= 124 &&
            p.lng <= 132 &&
            (!category || p.category === category),
        )
        .sort(
          (a, b) =>
            Math.hypot(
              a.lat - center.lat,
              (a.lng - center.lng) * Math.cos((center.lat * Math.PI) / 180),
            ) -
            Math.hypot(
              b.lat - center.lat,
              (b.lng - center.lng) * Math.cos((center.lat * Math.PI) / 180),
            ),
        )
        .slice(0, 100);
    },
    search: async (query, category) => {
      const region = findSearchRegion(query);
      // Excluded shops/accommodation must not consume the first page of results.
      const types =
        category === "카페" || category === "식당"
          ? ["39"]
          : category === "관광지"
            ? ["12", "14", "28"]
            : ["12", "14", "28", "39"];
      const found: Place[] = [];
      for (let index = 0; index < types.length; index += 2) {
        const batches = await Promise.all(
          types.slice(index, index + 2).map((contentTypeId) =>
            request(region ? "areaBasedList2" : "searchKeyword2", {
              ...(region
                ? { lDongRegnCd: region.province, numOfRows: "100" }
                : { keyword: query }),
              arrange: "A",
              contentTypeId,
            }),
          ),
        );
        found.push(...batches.flatMap(supported));
      }
      return found
        .filter(
          (p, index) => found.findIndex((other) => other.id === p.id) === index,
        )
        .filter(
          (p) =>
            !region?.cities ||
            region.cities.includes(p.address.trim().split(/\s+/)[1]),
        )
        .filter((p) => !category || p.category === category)
        .slice(0, region ? 100 : 20);
    },
    nearby: async (place) =>
      supported(
        await request("locationBasedList2", {
          mapX: String(place.lng),
          mapY: String(place.lat),
          radius: "10000",
          arrange: "E",
          contentTypeId: place.category === "관광지" ? "12" : "39",
        }),
      ).filter((p) => p.category === place.category),
    get: async (id) => {
      if (!/^\d{1,12}$/.test(id)) throw new ProviderError("invalid");
      const [common, pets] = await Promise.all([
        request("detailCommon2", { contentId: id }),
        request("detailPetTour2", { contentId: id }),
      ]);
      if (!common[0]) throw new ProviderError("invalid");
      const place = placeFrom(common[0]);
      if (place.id !== id) throw new ProviderError("invalid");
      const intro = await request("detailIntro2", {
        contentId: id,
        contentTypeId: text(common[0].contenttypeid),
      });
      const fields = [
        "acmpyTypeCd",
        "acmpyPsblCpam",
        "acmpyNeedMtr",
        "relaAcdntRiskMtr",
        "etcAcmpyInfo",
        "acmpyZone",
        "relaPosesFclty",
        "relaFrnshPrdlst",
      ];
      const fieldLabels: Record<string, string> = {
        acmpyTypeCd: "동반 가능 구역",
        acmpyPsblCpam: "동반 가능한 반려동물",
        acmpyNeedMtr: "방문객 준비사항",
        relaAcdntRiskMtr: "안전 안내",
        etcAcmpyInfo: "추가 동반 안내",
        acmpyZone: "동반 구역",
        relaPosesFclty: "현장에서 제공하는 시설",
        relaFrnshPrdlst: "현장에서 제공하는 물품",
      };
      const regulations = fields
        .map((key) =>
          pets[0]?.[key]
            ? `${fieldLabels[key] ?? "추가 안내"}: ${plain(pets[0][key])}`
            : "",
        )
        .filter(Boolean);
      const hours = Object.entries(intro[0] || {})
        .filter(([key]) =>
          /opentime|usetime|restdate|resttime|chkpet|reservation|infocenter/i.test(
            key,
          ),
        )
        .map(([key, value]) => {
          const label = /opentime|usetime/i.test(key)
            ? "이용 시간 안내"
            : /restdate|resttime/i.test(key)
              ? "휴무 안내"
              : /chkpet/i.test(key)
                ? "반려견 동반 안내"
                : /reservation/i.test(key)
                  ? "예약 안내"
                  : "문의 연락처";
          return `${label}: ${plain(value)}`;
        });
      const raw = [...new Set([...regulations, ...hours])].join("\n");
      return {
        place,
        raw,
        fetchedAt: new Date().toISOString(),
        modifiedAt: text(common[0].modifiedtime) || null,
        sourceUrl: "https://api.visitkorea.or.kr/",
        sourceLabel: "출처: ⓒ한국관광공사",
        phone:
          Object.entries(intro[0] || {})
            .find(
              ([key, value]) => /infocenter/i.test(key) && plain(value).trim(),
            )?.[1]
            ?.toString() || null,
      };
    },
  };
}
