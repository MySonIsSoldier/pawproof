import type {
  PlaceDocument,
  PlaceSource,
} from "../../application/ports/providers.ts";
import type { Place } from "../../domain/policies/types.ts";
import { foodSafetyDocumentFor } from "../food-safety/source.ts";

const compact = (value: string) =>
  value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s()[\]{}.,·'’“”"/_-]/g, "");

const identity = (place: Place) =>
  `${compact(place.name)}|${compact(place.address)}`;

function distanceMeters(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
) {
  const lat = ((from.lat + to.lat) / 2) * (Math.PI / 180);
  const dLat = (to.lat - from.lat) * 111_320;
  const dLng = (to.lng - from.lng) * 111_320 * Math.cos(lat);
  return Math.hypot(dLat, dLng);
}

function unique(primary: Place[], secondary: Place[]) {
  const result = [...primary];
  const known = new Set(result.map(identity));
  for (const place of secondary) {
    if (!known.has(identity(place))) {
      result.push(place);
      known.add(identity(place));
    }
  }
  return result;
}

export function mergedPlaceSource(
  primary: PlaceSource,
  secondary: PlaceSource,
): PlaceSource {
  const enrich = async (document: PlaceDocument): Promise<PlaceDocument> => {
    if (document.place.source !== "kto") return document;
    const match = foodSafetyDocumentFor(document.place);
    if (!match) return document;
    return {
      ...document,
      raw: `${document.raw}\n\n${match.raw}`,
      supplementalSources: [
        ...(document.supplementalSources || []),
        match.source,
      ],
    };
  };
  return {
    around: async (center, radius, category) =>
      unique(
        (await primary.around?.(center, radius, category)) || [],
        (await secondary.around?.(center, radius, category)) || [],
      )
        .sort((a, b) => distanceMeters(center, a) - distanceMeters(center, b))
        .slice(0, 100),
    search: async (query, category) =>
      unique(
        await primary.search(query, category),
        await secondary.search(query, category),
      ).slice(0, 100),
    nearby: async (place) =>
      unique(
        (await primary.nearby?.(place)) || [],
        (await secondary.nearby?.(place)) || [],
      ),
    get: async (id) => {
      const document = /^mfds-\d+$/.test(id)
        ? await secondary.get(id)
        : await primary.get(id);
      return enrich(document);
    },
  };
}
