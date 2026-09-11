import type { Place, TripInput } from "../domain/policies/types.ts";

export const demoPlaces: Place[] = [
  {
    id: "demo-forest",
    name: "초록숲 산책길",
    category: "관광지",
    address: "가상 체험 · 숲에서 시작하는 하루",
    lat: 37.44,
    lng: 126.64,
    source: "demo",
  },
  {
    id: "demo-table",
    name: "소담한 식탁",
    category: "식당",
    address: "가상 체험 · 작은 정원이 있는 식당",
    lat: 37.45,
    lng: 126.65,
    source: "demo",
  },
  {
    id: "demo-cafe",
    name: "느린 오후",
    category: "카페",
    address: "가상 체험 · 햇살 가득한 테라스",
    lat: 37.46,
    lng: 126.63,
    source: "demo",
  },
  {
    id: "demo-lake",
    name: "물빛 호수공원",
    category: "관광지",
    address: "가상 체험 · 물가를 걷는 산책 코스",
    lat: 37.47,
    lng: 126.62,
    source: "demo",
  },
  {
    id: "demo-garden",
    name: "마당 있는 식탁",
    category: "식당",
    address: "가상 체험 · 크기에 상관없이 함께",
    lat: 37.451,
    lng: 126.654,
    source: "demo",
  },
  {
    id: "demo-picnic",
    name: "피크닉 키친",
    category: "식당",
    address: "가상 체험 · 느긋한 점심 식사",
    lat: 37.46,
    lng: 126.67,
    source: "demo",
  },
  {
    id: "demo-roast",
    name: "숲옆 로스터리",
    category: "카페",
    address: "가상 체험 · 잠시 쉬어가는 커피",
    lat: 37.465,
    lng: 126.63,
    source: "demo",
  },
];
export function createDemoTrip(date: string): TripInput {
  return {
    mode: "demo",
    pets: [{ name: "두부", breed: "웰시코기", weight: 12 }],
    date,
    startTime: "10:00",
    equipment: ["목줄"],
    visits: demoPlaces.slice(0, 4).map((p) => ({
      placeId: p.id,
      duration: p.category === "식당" ? 60 : 45,
      zone: p.category === "관광지" ? "outdoor" : "indoor",
      locked: false,
    })),
  };
}
