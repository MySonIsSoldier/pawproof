/** Search scopes, not a claim that every venue permits every dog. */
export const pilotRegion = "서울 명동";
export const regionSuggestions = [pilotRegion, "서울", "명동", "종로", "중구", "경기 북서부", "인천"];

export function findSearchRegion(query: string): {
  province: string;
  cities?: readonly string[];
} | null {
  const name = query.trim();
  if (name === "경기 북서부")
    return { province: "41", cities: ["고양시", "파주시", "양주시"] };
  if (name === pilotRegion)
    return { province: "11", cities: ["중구", "종로구"] };
  if (["서울", "서울특별시"].includes(name)) return { province: "11" };
  if (["명동", "중구", "중구청"].includes(name))
    return { province: "11", cities: ["중구"] };
  if (["종로", "종로구"].includes(name))
    return { province: "11", cities: ["종로구"] };
  for (const city of ["고양", "파주", "양주"]) {
    if (
      [city, `${city}시`, `경기 ${city}시`, `경기도 ${city}시`].includes(name)
    )
      return { province: "41", cities: [`${city}시`] };
  }
  if (["경기", "경기도"].includes(name)) return { province: "41" };
  if (["강원", "강원도", "강원특별자치도"].includes(name))
    return { province: "51" };
  if (["인천", "인천광역시"].includes(name)) return { province: "28" };
  return null;
}
