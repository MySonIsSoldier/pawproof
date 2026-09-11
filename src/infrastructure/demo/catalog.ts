import type { Place, Policy, Rule, TripInput } from "../../domain/policies/types.ts";
import { koreaToday } from "../../domain/itinerary/time.ts";
import type { Providers } from "../../application/ports/providers.ts";

export const demoPlaces: Place[] = [
  { id: "demo-forest", name: "초록숲 산책길", category: "관광지", address: "가상 체험 · 숲에서 시작하는 하루", lat: 37.44, lng: 126.64, source: "demo" },
  { id: "demo-table", name: "소담한 식탁", category: "식당", address: "가상 체험 · 작은 정원이 있는 식당", lat: 37.45, lng: 126.65, source: "demo" },
  { id: "demo-cafe", name: "느린 오후", category: "카페", address: "가상 체험 · 햇살 가득한 테라스", lat: 37.46, lng: 126.63, source: "demo" },
  { id: "demo-lake", name: "물빛 호수공원", category: "관광지", address: "가상 체험 · 물가를 걷는 산책 코스", lat: 37.47, lng: 126.62, source: "demo" },
  { id: "demo-garden", name: "마당 있는 식탁", category: "식당", address: "가상 체험 · 크기에 상관없이 함께", lat: 37.451, lng: 126.654, source: "demo" },
  { id: "demo-picnic", name: "피크닉 키친", category: "식당", address: "가상 체험 · 느긋한 점심 식사", lat: 37.46, lng: 126.67, source: "demo" },
  { id: "demo-roast", name: "숲옆 로스터리", category: "카페", address: "가상 체험 · 잠시 쉬어가는 커피", lat: 37.465, lng: 126.63, source: "demo" },
];
function rule(kind: Rule["kind"], quote: string, extra: Partial<Rule> = {}): Rule { return { kind, scope: "all", operator: "allow", value: null, items: [], quote, ...extra }; }
export function demoPolicy(id: string): Policy {
  const rules: Rule[] = [
    rule("entry", "반려견은 실내와 실외 모두 동반 가능합니다."),
    rule("weight", "체중 제한 없이 동반 가능합니다."),
    rule("count", "마릿수 제한 없이 동반 가능합니다."),
    rule("breed", "견종 제한 없이 동반 가능합니다."),
    rule("equipment", "목줄 착용은 필수입니다.", { operator: "all", items: ["목줄"] }),
    rule("hours", "운영시간은 09:00부터 19:00까지입니다.", { operator: "all", items: ["09:00", "19:00"] }),
    rule("closedDays", "정기 휴무 없이 매일 운영합니다.", { operator: "all" }),
  ];
  if (id === "demo-table") rules[1] = rule("weight", "반려견은 10kg 이하만 동반 가능합니다.", { operator: "lte", value: 10 });
  if (id === "demo-cafe") rules.push(rule("equipment", "이동장 또는 유모차를 이용해 주세요.", { operator: "any", items: ["이동장", "유모차"] }));
  if (id === "demo-lake") rules.splice(2, 1);
  return { rules, unresolved: [], raw: rules.map((r) => r.quote).join("\n"), sourceLabel: "PawProof 자체 작성 가상 규정", sourceUrl: null, fetchedAt: new Date().toISOString(), modifiedAt: null };
}
export function createDemoTrip(): TripInput {
  return { mode: "demo", pets: [{ name: "두부", breed: "웰시코기", weight: 12 }], date: koreaToday(), startTime: "10:00", equipment: ["목줄"], visits: demoPlaces.slice(0, 4).map((p) => ({ placeId: p.id, duration: p.category === "식당" ? 60 : 45, zone: p.category === "관광지" ? "outdoor" : "indoor", locked: false })) };
}
export function demoProviders(): Providers {
  const get = async (id: string) => {
    const place = demoPlaces.find((p) => p.id === id);
    if (!place) throw new Error("가상 장소를 찾을 수 없어요.");
    return { place, ...demoPolicy(id) };
  };
  return {
    places: { get, search: async (query, category) => demoPlaces.filter((p) => p.name.includes(query) && (!category || p.category === category)), nearby: async (place) => demoPlaces.filter((p) => p.category === place.category) },
    extractor: { extract: async (document) => demoPolicy(document.place.id) },
    travel: { basis: "demo", minutes: async (a, b) => Math.max(5, Math.round(Math.hypot(a.lat - b.lat, a.lng - b.lng) * 400)) },
  };
}
