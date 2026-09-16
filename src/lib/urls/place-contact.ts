import type { Place } from "../../domain/policies/types.ts";
export function kakaoPlaceSearch(place: Pick<Place, "name" | "address">) {
  return `https://map.kakao.com/link/search/${encodeURIComponent(`${place.name} ${place.address}`)}`;
}
export function telephoneLink(phone: string | null) {
  const cleaned = phone?.trim().replace(/[\s().-]/g, "") ?? "";
  return /^(?:0\d{8,10}|1\d{7}|\+82\d{8,10})$/.test(cleaned)
    ? `tel:${cleaned}`
    : null;
}
