import { z } from "zod";
import { kakaoMapKey } from "../../config/maps";
export type Point = { lat: number; lng: number };
type LatLng = { getLat(): number; getLng(): number };
export type KakaoMap = {
  setCenter(point: LatLng): void;
  getCenter(): LatLng;
  relayout(): void;
  setLevel(level: number): void;
  getLevel(): number;
  getProjection(): {
    containerPointFromCoords(point: LatLng): { x: number; y: number };
  };
  setBounds(
    bounds: { extend(point: LatLng): void },
    paddingTop?: number,
    paddingRight?: number,
    paddingBottom?: number,
    paddingLeft?: number,
  ): void;
};
type Overlay = { setMap(map: KakaoMap | null): void };
type SearchCallback = (data: unknown, status: string) => void;
export type KakaoMaps = {
  load(callback: () => void): void;
  LatLng: new (lat: number, lng: number) => LatLng;
  Map: new (
    container: HTMLElement,
    options: { center: LatLng; level: number },
  ) => KakaoMap;
  LatLngBounds: new () => { extend(point: LatLng): void };
  Polyline: new (options: {
    map: KakaoMap;
    path: LatLng[];
    strokeWeight: number;
    strokeColor: string;
    strokeOpacity: number;
    strokeStyle: string;
    endArrow: boolean;
  }) => Overlay;
  CustomOverlay: new (options: {
    map: KakaoMap;
    position: LatLng;
    content: HTMLElement;
    yAnchor: number;
    zIndex: number;
  }) => Overlay;
  Circle: new (options: {
    map: KakaoMap;
    center: LatLng;
    radius: number;
    strokeWeight: number;
    strokeColor: string;
    strokeOpacity: number;
    fillColor: string;
    fillOpacity: number;
  }) => Overlay;
  event: {
    addListener(target: KakaoMap, event: string, callback: () => void): void;
    removeListener(target: KakaoMap, event: string, callback: () => void): void;
    preventMap(): void;
  };
  services: {
    Geocoder: new () => {
      addressSearch(query: string, callback: SearchCallback): void;
    };
    Places: new () => {
      keywordSearch(query: string, callback: SearchCallback): void;
    };
  };
};
declare global {
  interface Window {
    kakao?: { maps: KakaoMaps };
  }
}
let loading: Promise<KakaoMaps> | undefined;
export function loadKakaoMaps(): Promise<KakaoMaps> {
  if (!kakaoMapKey)
    return Promise.reject(
      new Error(
        "지도 연결을 준비 중이에요. 장소 목록은 계속 이용할 수 있어요.",
      ),
    );
  if (loading) return loading;
  loading = new Promise<KakaoMaps>((resolve, reject) => {
    const script = document.createElement("script");
    let finished = false;
    const timeout = window.setTimeout(fail, 15000);
    function fail() {
      if (finished) return;
      finished = true;
      window.clearTimeout(timeout);
      script.remove();
      reject(
        new Error(
          "지도를 불러오지 못했어요. 목록을 이용하거나 다시 시도해 주세요.",
        ),
      );
    }
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?${new URLSearchParams({ appkey: kakaoMapKey, autoload: "false", libraries: "services" })}`;
    script.onerror = fail;
    script.onload = () => {
      if (!window.kakao?.maps?.load) return fail();
      window.kakao.maps.load(() => {
        if (finished) return;
        if (!window.kakao?.maps.Map || !window.kakao.maps.services)
          return fail();
        finished = true;
        clearTimeout(timeout);
        resolve(window.kakao.maps);
      });
    };
    document.head.appendChild(script);
  }).catch((error) => {
    loading = undefined;
    throw error;
  });
  return loading;
}
const destinationsSchema = z.array(
  z.object({
    x: z.coerce.number().min(124).max(132),
    y: z.coerce.number().min(32).max(39.5),
    address_name: z.string(),
    place_name: z.string().optional(),
  }),
);
export type Destination = Point & { name: string; address: string };
export async function findDestinations(query: string): Promise<Destination[]> {
  const maps = await loadKakaoMaps();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () =>
        reject(new Error("여행지 검색이 지연되고 있어요. 다시 시도해 주세요.")),
      15000,
    );
    const finish: SearchCallback = (data, status) => {
      clearTimeout(timer);
      if (status === "ZERO_RESULT") return resolve([]);
      const parsed = destinationsSchema.safeParse(data);
      if (status !== "OK" || !parsed.success)
        return reject(
          new Error("여행지를 찾지 못했어요. 지역명이나 주소를 확인해 주세요."),
        );
      resolve(
        parsed.data.slice(0, 5).map((p) => ({
          lat: p.y,
          lng: p.x,
          name: p.place_name || p.address_name,
          address: p.address_name,
        })),
      );
    };
    new maps.services.Geocoder().addressSearch(query, (data, status) => {
      if (status === "ZERO_RESULT")
        new maps.services.Places().keywordSearch(query, finish);
      else finish(data, status);
    });
  });
}
