"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "../../components/ui/button";
import type { Place, Status } from "../../domain/policies/types";
import { groupMapPlaces } from "./group-map-places";
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
  route,
  group,
}: {
  places: { place: Place; status: Status }[];
  center: Point;
  radius: number;
  selected: string | null;
  select: (id: string) => void;
  moved: (point: Point) => void;
  route: Place[];
  group: (ids: string[]) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [instance, setInstance] = useState<{
    map: KakaoMap;
    maps: KakaoMaps;
  } | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const handlers = useRef({ select, moved, group });
  useEffect(() => {
    handlers.current = { select, moved, group };
  }, [select, moved, group]);
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
          if (
            container.current?.clientWidth &&
            container.current.clientHeight
          ) {
            const center = map.getCenter();
            map.relayout();
            map.setCenter(center);
          }
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
    let overlays: { setMap(map: KakaoMap | null): void }[] = [];
    function draw() {
      overlays.forEach((overlay) => overlay.setMap(null));
      const combined = [
        ...places,
        ...route
          .filter((p) => !places.some((item) => item.place.id === p.id))
          .map((place) => ({ place, status: "confirm" as const })),
      ];
      const groups = groupMapPlaces(combined, (p) =>
        map
          .getProjection()
          .containerPointFromCoords(new maps.LatLng(p.lat, p.lng)),
      );
      overlays = groups.map((items) => {
        const { place, status } = items[0];
        const grouped = items.length > 1;
        const visit = route.findIndex((p) => p.id === place.id);
        const isSelected = items.some((item) => item.place.id === selected);
        const button = document.createElement("button");
        button.type = "button";
        button.className = `map-pin ${grouped ? "grouped" : status}${isSelected ? " selected" : ""}${visit >= 0 && !grouped ? " in-route" : ""}`;
        button.textContent = grouped
          ? `${items.length}곳`
          : `${visit >= 0 ? `코스 ${visit + 1} · ` : ""}${place.name}`;
        button.title = grouped
          ? items.map((item) => item.place.name).join(" · ")
          : place.name;
        button.setAttribute(
          "aria-label",
          grouped
            ? `겹친 장소 ${items.length}곳 모두 보기`
            : `${place.name} 지도에서 선택`,
        );
        button.onclick = (e) => {
          e.stopPropagation();
          maps.event.preventMap();
          if (grouped)
            handlers.current.group(items.map((item) => item.place.id));
          else handlers.current.select(place.id);
        };
        return new maps.CustomOverlay({
          map,
          position: new maps.LatLng(place.lat, place.lng),
          content: button,
          yAnchor: 1,
          zIndex: isSelected ? 10 : visit >= 0 ? 5 : 1,
        });
      });
    }
    draw();
    maps.event.addListener(map, "idle", draw);
    const resize = new ResizeObserver(draw);
    if (container.current) resize.observe(container.current);
    return () => {
      resize.disconnect();
      maps.event.removeListener(map, "idle", draw);
      overlays.forEach((overlay) => overlay.setMap(null));
    };
  }, [instance, places, selected, route]);
  useEffect(() => {
    if (!instance || route.length < 2) return;
    const { map, maps } = instance;
    const line = new maps.Polyline({
      map,
      path: route.map((p) => new maps.LatLng(p.lat, p.lng)),
      strokeWeight: 5,
      strokeColor: "#2f6b50",
      strokeOpacity: 0.85,
      strokeStyle: "shortdash",
      endArrow: true,
    });
    return () => line.setMap(null);
  }, [instance, route]);
  function fitRoute() {
    if (!instance || !route.length) return;
    const bounds = new instance.maps.LatLngBounds();
    route.forEach((p) => bounds.extend(new instance.maps.LatLng(p.lat, p.lng)));
    instance.map.setBounds(bounds, 80, 80, 120, 80);
  }
  return (
    <div className="kakao-map-shell">
      <div
        ref={container}
        className="kakao-map-canvas"
        role="region"
        aria-label="주변 반려견 동반 후보 지도"
      />
      {instance && (
        <div className="map-controls" aria-label="지도 조작">
          <Button
            variant="outline"
            aria-label="지도 확대"
            onClick={() =>
              instance.map.setLevel(Math.max(1, instance.map.getLevel() - 1))
            }
          >
            +
          </Button>
          <Button
            variant="outline"
            aria-label="지도 축소"
            onClick={() =>
              instance.map.setLevel(Math.min(14, instance.map.getLevel() + 1))
            }
          >
            −
          </Button>
          {!!route.length && (
            <Button variant="outline" onClick={fitRoute}>
              코스 전체
            </Button>
          )}
        </div>
      )}
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
