/** Search scopes, not a claim that every venue permits every dog. */
export const pilotRegion = "경기 북서부";
export const regionSuggestions = [pilotRegion, "고양", "파주", "양주", "인천"];

export function findSearchRegion(query: string): {
  province: string;
  cities?: readonly string[];
} | null {
  const name = query.trim();
  if (name === pilotRegion)
    return { province: "41", cities: ["고양시", "파주시", "양주시"] };
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
