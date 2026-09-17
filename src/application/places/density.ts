import type { Place } from "../../domain/policies/types.ts";

export type DenseCenter = {
  center: { lat: number; lng: number };
  count: number;
};

function distanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const earthRadius = 6_371_000;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const sine =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return earthRadius * 2 * Math.atan2(Math.sqrt(sine), Math.sqrt(1 - sine));
}

export function densestCenter(places: Place[], radiusMeters: number): DenseCenter | null {
  const candidates = places.filter(
    (place) =>
      Number.isFinite(place.lat) &&
      Number.isFinite(place.lng) &&
      place.lat >= 32 &&
      place.lat <= 39.5 &&
      place.lng >= 124 &&
      place.lng <= 132,
  );
  if (!candidates.length) return null;
  return candidates.reduce<DenseCenter>((best, candidate) => {
    const count = candidates.filter(
      (place) => distanceMeters(candidate, place) <= radiusMeters,
    ).length;
    return count > best.count
      ? { center: { lat: candidate.lat, lng: candidate.lng }, count }
      : best;
  }, { center: { lat: candidates[0].lat, lng: candidates[0].lng }, count: 0 });
}
