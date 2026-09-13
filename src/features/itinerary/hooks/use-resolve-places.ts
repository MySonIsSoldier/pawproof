"use client";
import { useEffect } from "react";
import { callApi } from "../api";
import { placeSchema } from "../../../application/contracts/result";
import { useTripStore, useTripStoreApi } from "../state/planner-provider";
export function useResolvePlaces() {
  const store = useTripStoreApi();
  const missing = useTripStore((s) =>
    s.trip.mode === "live"
      ? s.trip.visits
          .filter((v) => !s.places[v.placeId])
          .map((v) => v.placeId)
          .join(",")
      : "",
  );
  useEffect(() => {
    if (!missing) return;
    const controller = new AbortController();
    void Promise.allSettled(
      missing
        .split(",")
        .map((id) =>
          callApi(
            `/api/places/${id}`,
            placeSchema,
            undefined,
            controller.signal,
          ),
        ),
    ).then((results) => {
      if (controller.signal.aborted) return;
      const places = results.flatMap((result) =>
        result.status === "fulfilled" ? [result.value] : [],
      );
      if (places.length) store.getState().remember(places);
      if (results.some((r) => r.status === "rejected"))
        store
          .getState()
          .notify(
            "일부 장소 정보를 불러오지 못했어요. 연결 후 다시 검사해 주세요.",
          );
    });
    return () => controller.abort();
  }, [missing, store]);
}
