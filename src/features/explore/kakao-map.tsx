"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "../../components/ui/button";
import type { Place, Status } from "../../domain/policies/types";
import { initialMapCenter } from "../../config/maps";
import {
  loadKakaoMaps,
  type Point,
  type KakaoMap,
  type KakaoMaps,
} from "./kakao-sdk";

export function KakaoMapView({
  places,
  center,
  radius,
  selected,
  select,
  moved,
}: {
  places: { place: Place; status: Status }[];
  center: Point;
  radius: number;
  selected: string | null;
  select: (id: string) => void;
  moved: (point: Point) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [instance, setInstance] = useState<{
    map: KakaoMap;
    maps: KakaoMaps;
  } | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const handlers = useRef({ select, moved });
  useEffect(() => {
    handlers.current = { select, moved };
  }, [select, moved]);
  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    loadKakaoMaps()
      .then((maps) => {
        if (disposed || !container.current) return;
        const map = new maps.Map(container.current, {
          center: new maps.LatLng(initialMapCenter.lat, initialMapCenter.lng),
          level: 7,
        });
        const idle = () => {
          const p = map.getCenter();
          handlers.current.moved({ lat: p.getLat(), lng: p.getLng() });
        };
        maps.event.addListener(map, "idle", idle);
        const resize = new ResizeObserver(() => {
          if (container.current?.clientWidth && container.current.clientHeight)
            map.relayout();
        });
        resize.observe(container.current);
        setInstance({ map, maps });
        cleanup = () => {
          resize.disconnect();
          maps.event.removeListener(map, "idle", idle);
        };
      })
      .catch((e: Error) => {
        if (!disposed) setError(e.message);
      });
    return () => {
      disposed = true;
      cleanup();
    };
  }, [attempt]);
  useEffect(() => {
    if (!instance) return;
    const { map, maps } = instance;
    map.setCenter(new maps.LatLng(center.lat, center.lng));
    map.setLevel(radius <= 3000 ? 6 : radius <= 5000 ? 7 : 8);
    const circle = new maps.Circle({
      map,
      center: new maps.LatLng(center.lat, center.lng),
      radius,
      strokeWeight: 1,
      strokeColor: "#2f6b50",
      strokeOpacity: 0.3,
      fillColor: "#2f6b50",
      fillOpacity: 0.035,
    });
    return () => circle.setMap(null);
  }, [instance, center.lat, center.lng, radius]);
  useEffect(() => {
    if (!instance) return;
    const { map, maps } = instance;
    const overlays = places.map(({ place, status }, i) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `map-pin ${status}${selected === place.id ? " selected" : ""}`;
      button.textContent = String(i + 1);
      button.setAttribute("aria-label", `${place.name} 지도에서 선택`);
      button.onclick = (e) => {
        e.stopPropagation();
        maps.event.preventMap();
        handlers.current.select(place.id);
      };
      return new maps.CustomOverlay({
        map,
        position: new maps.LatLng(place.lat, place.lng),
        content: button,
        yAnchor: 1,
        zIndex: selected === place.id ? 10 : 1,
      });
    });
    return () => overlays.forEach((overlay) => overlay.setMap(null));
  }, [instance, places, selected]);
  return (
    <div className="kakao-map-shell">
      <div
        ref={container}
        className="kakao-map-canvas"
        role="region"
        aria-label="주변 반려견 동반 후보 지도"
      />
      {!instance && (
        <div className="map-loading" role="status">
          <strong>
            {error ? "지도를 표시하지 못했어요" : "주변 지도를 펼치고 있어요"}
          </strong>
          <p>{error || "잠시만 기다려 주세요."}</p>
          {error && (
            <Button
              variant="outline"
              onClick={() => {
                setError("");
                setAttempt((n) => n + 1);
              }}
            >
              지도 다시 불러오기
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
