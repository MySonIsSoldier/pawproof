import { z } from "zod";
import type { PlaceSource } from "../../application/ports/providers.ts";
import type { Category, Place } from "../../domain/policies/types.ts";
import snapshot from "../../../data/food-safety/pet-friendly-food-2026-03-31.json" with {
  type: "json",
};

const recordSchema = z.object({
  "연번": z.string(),
  "업소명": z.string(),
  "업종": z.string(),
  "지역": z.string(),
  "업소주소": z.string(),
  "비고": z.string(),
  lat: z.number().finite(),
  lng: z.number().finite(),
  geocodeAddress: z.string(),
  geocodeStatus: z.literal("matched"),
});
const data = z
  .object({
    sourceUrl: z.url(),
    noticeUrl: z.url(),
    downloadUrl: z.url(),
    publishedAt: z.iso.date(),
    accessedAt: z.iso.date(),
    recordCount: z.number().int().positive(),
    records: z.array(recordSchema),
  })
  .parse(snapshot);

const categoryOf = (industry: string): Category =>
  industry === "일반음식점" ? "식당" : "카페";

const compact = (value: string) =>
  value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s()[\]{}.,·'’“”"/_-]/g, "");

const recordPlace = (record: z.infer<typeof recordSchema>): Place => ({
  id: `mfds-${record["연번"]}`,
  name: record["업소명"],
  category: categoryOf(record["업종"]),
  address: record["업소주소"],
  lat: record.lat,
  lng: record.lng,
  source: "mfds",
});

const records = data.records.map((record) => ({
  record,
  place: recordPlace(record),
}));

function distanceMeters(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
) {
  const lat = ((from.lat + to.lat) / 2) * (Math.PI / 180);
  const dLat = (to.lat - from.lat) * 111_320;
  const dLng = (to.lng - from.lng) * 111_320 * Math.cos(lat);
  return Math.hypot(dLat, dLng);
}

function rawFor(record: z.infer<typeof recordSchema>) {
  return [
    `식품안전나라 반려동물 동반출입 음식점 목록에 등재된 업소예요.`,
    `업소명: ${record["업소명"]}`,
    `업종: ${record["업종"]}`,
    `주소: ${record["업소주소"]}`,
    `목록 기준일: ${data.publishedAt}`,
    `세부 조건(실내·테라스·체중·마릿수·견종·예약)은 방문 전 업소에 확인해 주세요.`,
  ].join("\n");
}

export function foodSafetySource(): PlaceSource {
  const getRecord = (id: string) =>
    records.find((entry) => entry.place.id === id);
  const filter = (items: typeof records, category?: Category) =>
    items
      .filter(({ place }) => !category || place.category === category)
      .map(({ place }) => place);
  return {
    around: async (center, radius, category) =>
      filter(
        records.filter(
          ({ place }) => distanceMeters(center, place) <= radius,
        ),
        category,
      ).sort(
        (a, b) => distanceMeters(center, a) - distanceMeters(center, b),
      ),
    search: async (query, category) => {
      const needle = compact(query);
      return filter(
        records.filter(({ record }) =>
          [record["업소명"], record["업소주소"], record["지역"]]
            .map(compact)
            .some((value) => value.includes(needle)),
        ),
        category,
      );
    },
    nearby: async (place) =>
      filter(
        records.filter(
          ({ place: candidate }) =>
            candidate.category === place.category &&
            distanceMeters(place, candidate) <= 10_000,
        ),
      ),
    get: async (id) => {
      const entry = getRecord(id);
      if (!entry) throw new Error("Food Safety Korea place not found");
      return {
        place: entry.place,
        raw: rawFor(entry.record),
        fetchedAt: `${data.accessedAt}T00:00:00.000Z`,
        modifiedAt: data.publishedAt,
        sourceUrl: data.sourceUrl,
        sourceLabel: "출처: 식품의약품안전처·식품안전나라 동반출입 음식점 목록",
        supplementalSources: [
          {
            label: "식품안전나라 동반출입 음식점 목록",
            url: data.sourceUrl,
            publishedAt: data.publishedAt,
            accessedAt: data.accessedAt,
            phone: null,
            raw: rawFor(entry.record),
          },
        ],
      };
    },
  };
}

export function foodSafetyMatch(place: Place) {
  const name = compact(place.name);
  const address = compact(place.address);
  return records.find(
    ({ place: candidate }) =>
      compact(candidate.name) === name && compact(candidate.address) === address,
  );
}

export function foodSafetyDocumentFor(place: Place) {
  const match = foodSafetyMatch(place);
  if (!match) return null;
  return {
    raw: rawFor(match.record),
    source: {
      label: "식품안전나라 동반출입 음식점 목록",
      url: data.sourceUrl,
      publishedAt: data.publishedAt,
      accessedAt: data.accessedAt,
      phone: null,
      raw: rawFor(match.record),
    },
  };
}
