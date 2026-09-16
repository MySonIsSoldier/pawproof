"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { createStore } from "zustand/vanilla";
import { useStore } from "zustand";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { Category, TripInput, Zone } from "../../domain/policies/types";
import { assessDiscovery } from "../../domain/policies/discovery";
import {
  inspectionsSchema,
  type Inspection,
} from "../../application/contracts/discovery";
import { searchResultSchema } from "../../application/contracts/result";
import { callApi } from "../itinerary/api";
import { initialMapCenter } from "../../config/maps";
import { findDestinations, type Point, type Destination } from "./kakao-sdk";

type ExplorerState = {
  center: Point;
  draftCenter: Point;
  radius: number;
  category: Category | "";
  term: string;
  area: string;
  selected: string | null;
  expanded: boolean;
  fitOnly: boolean;
  confirmedOnly: boolean;
  zone: Zone;
  checks: Record<string, Inspection>;
  targets: Destination[];
  message: string;
  locating: boolean;
  patch: (next: Partial<Omit<ExplorerState, "patch">>) => void;
};
function createExplorerStore() {
  return createStore<ExplorerState>()((set) => ({
    center: initialMapCenter,
    draftCenter: initialMapCenter,
    radius: 5000,
    category: "",
    term: "",
    area: "고양 일산호수공원 주변",
    selected: null,
    expanded: false,
    fitOnly: false,
    confirmedOnly: false,
    zone: "outdoor",
    checks: {},
    targets: [],
    message: "",
    locating: false,
    patch: (next) => set(next),
  }));
}
export function useExplorer(trip: TripInput, active: boolean) {
  const [store] = useState(createExplorerStore);
  const state = useStore(store);
  const controller = useRef<AbortController | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      controller.current?.abort();
    };
  }, []);
  const search = useQuery({
    queryKey: ["map-places", state.center, state.radius, state.category],
    enabled: active,
    queryFn: ({ signal }) => {
      const params = new URLSearchParams({
        lat: String(state.center.lat),
        lng: String(state.center.lng),
        radius: String(state.radius),
      });
      if (state.category) params.set("category", state.category);
      return callApi(
        `/api/discovery/nearby?${params}`,
        searchResultSchema,
        undefined,
        signal,
      );
    },
  });
  const inspect = useMutation({
    mutationFn: async (ids: string[]) => {
      if (controller.current) throw new Error("조건 확인이 진행 중이에요.");
      const current = new AbortController();
      controller.current = current;
      try {
        return await callApi(
          "/api/discovery/inspect",
          inspectionsSchema,
          { ids },
          current.signal,
        );
      } finally {
        controller.current = null;
      }
    },
    onSuccess: ({ checks, failedIds }) => {
      if (!alive.current) return;
      const previous = store.getState().checks;
      store.getState().patch({
        checks: Object.fromEntries(
          Object.entries({
            ...previous,
            ...Object.fromEntries(checks.map((c) => [c.place.id, c])),
          }).slice(-100),
        ),
        message: failedIds.length
          ? `${failedIds.length}곳의 정보를 가져오지 못했어요. 다시 확인해 주세요.`
          : "규정 조회를 마쳤어요. 남은 확인사항을 살펴보세요.",
      });
    },
  });
  const destination = useMutation({
    mutationFn: findDestinations,
    onSuccess: (targets) => {
      if (alive.current)
        store.getState().patch({
          targets,
          message: targets.length
            ? "찾으신 위치를 선택해 주세요."
            : "검색 결과가 없어요. 더 구체적인 지역이나 주소를 입력해 주세요.",
        });
    },
  });
  const candidates = useMemo(
    () =>
      (search.data?.places ?? []).map((place) => {
        const check = state.checks[place.id];
        return {
          place,
          check,
          ...assessDiscovery(check?.policy, trip, state.zone),
        };
      }),
    [search.data, state.checks, trip, state.zone],
  );
  const visible = useMemo(
    () =>
      candidates.filter(
        (c) =>
          (!state.fitOnly || c.status !== "blocked") &&
          (!state.confirmedOnly || ["available", "prepare"].includes(c.status)),
      ),
    [candidates, state.fitOnly, state.confirmedOnly],
  );
  const selected = candidates.find((c) => c.place.id === state.selected);
  function setArea(center: Point, area: string) {
    state.patch({
      center,
      draftCenter: center,
      area,
      targets: [],
      selected: null,
      message: "",
    });
  }
  function locate() {
    if (!navigator.geolocation) {
      state.patch({
        message: "위치를 사용할 수 없어요. 여행지를 검색해 주세요.",
      });
      return;
    }
    state.patch({ locating: true, message: "" });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!alive.current) return;
        const { latitude: lat, longitude: lng } = position.coords;
        state.patch({ locating: false });
        if (lat < 32 || lat > 39.5 || lng < 124 || lng > 132) {
          state.patch({
            message:
              "현재는 국내 장소를 찾을 수 있어요. 국내 여행지를 검색해 주세요.",
          });
          return;
        }
        setArea({ lat, lng }, "내 위치 주변");
      },
      () => {
        if (alive.current)
          state.patch({
            locating: false,
            message:
              "현재 위치를 가져오지 못했어요. 위치 권한을 확인하거나 여행지를 검색해 주세요.",
          });
      },
      { timeout: 10000, maximumAge: 60000 },
    );
  }
  return {
    state,
    search,
    inspect,
    destination,
    candidates,
    visible,
    selected,
    setArea,
    locate,
  };
}
