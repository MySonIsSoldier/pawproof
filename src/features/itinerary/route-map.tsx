"use client";
import { useEffect, useRef, useState } from "react";
import type { Place } from "../../domain/policies/types";
import {
  loadKakaoMaps,
  type KakaoMap,
  type KakaoMaps,
} from "../explore/kakao-sdk";

export function RouteMap({ places }: { places: Place[] }) {
  const drawablePlaces = places.filter(
    (place) =>
      Number.isFinite(place.lat) &&
      Number.isFinite(place.lng) &&
      place.lat >= 32 &&
      place.lat <= 39.5 &&
      place.lng >= 124 &&
      place.lng <= 132,
  );
  const container = useRef<HTMLDivElement>(null);
  const [instance, setInstance] = useState<{
    map: KakaoMap;
    maps: KakaoMaps;
  } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    loadKakaoMaps()
      .then((maps) => {
        if (disposed || !container.current) return;
        const map = new maps.Map(container.current, {
          center: new maps.LatLng(37.5665, 126.978),
          level: 8,
          draggable: false,
          scrollwheel: false,
          disableDoubleClickZoom: true,
          keyboardShortcuts: false,
        });
        map.setDraggable?.(false);
        map.setZoomable?.(false);
        const resize = new ResizeObserver(() => map.relayout());
        resize.observe(container.current);
        setInstance({ map, maps });
        cleanup = () => resize.disconnect();
      })
      .catch((reason: unknown) => {
        if (!disposed)
          setError(
            reason instanceof Error
              ? reason.message
              : "지도를 불러오지 못했어요.",
          );
      });
    return () => {
      disposed = true;
      cleanup();
    };
  }, []);
  useEffect(() => {
    if (!instance || !drawablePlaces.length) return;
    const { map, maps } = instance;
    const points = drawablePlaces.map(
      (place) => new maps.LatLng(place.lat, place.lng),
    );
    if (points.length === 1) {
      map.setCenter(points[0]);
      map.setLevel(7);
    } else {
      const bounds = new maps.LatLngBounds();
      points.forEach((point) => bounds.extend(point));
      map.setBounds(bounds, 70, 70, 70, 70);
    }
    const overlays = drawablePlaces.map((place, index) => {
      const marker = document.createElement("span");
      marker.className = "route-map-marker";
      marker.textContent = String(index + 1);
      marker.setAttribute("aria-label", `${index + 1}번 ${place.name}`);
      return new maps.CustomOverlay({
        map,
        position: new maps.LatLng(place.lat, place.lng),
        content: marker,
        yAnchor: 0.5,
        zIndex: 2,
      });
    });
    const line =
      points.length > 1
        ? new maps.Polyline({
            map,
            path: points,
            strokeWeight: 5,
            strokeColor: "#2f6b50",
            strokeOpacity: 0.85,
            strokeStyle: "shortdash",
            endArrow: true,
          })
        : null;
    return () => {
      overlays.forEach((overlay) => overlay.setMap(null));
      line?.setMap(null);
    };
  }, [instance, drawablePlaces]);
  return (
    <div className="route-map-shell">
      <div ref={container} className="route-map-canvas" role="img" aria-label="실제 카카오 지도에 표시한 방문 순서" />
      {!instance && (
        <div className="route-map-loading" role="status">
          {error || "카카오 지도를 준비하고 있어요…"}
        </div>
      )}
    </div>
  );
}
