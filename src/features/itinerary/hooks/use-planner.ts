"use client";

import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import type {
  Place,
  TripInput,
  VisitResult,
} from "../../../domain/policies/types";
import type { Alternative } from "../../../application/use-cases/recover-trip";
import { useTripStore, useTripStoreApi } from "../state/planner-provider";
import { findTripPlace, isTripStale } from "../state/trip-store";
import { initialTrip } from "../state/initial-trip";
import { useTripOperations } from "./use-trip-operations";
import { useTripPersistence } from "./use-trip-persistence";

/** Compose UI operations; business policy evaluation remains on the server. */
export function usePlanner() {
  const store = useTripStoreApi();
  const state = useTripStore(
    useShallow((s) => ({
      trip: s.trip,
      places: s.places,
      result: s.verification?.result || null,
      stale: isTripStale(s),
      previous: s.previous,
      notice: s.notice,
      error: s.error,
    })),
  );
  const operations = useTripOperations();
  const persistence = useTripPersistence();
  const [detail, setDetail] = useState<VisitResult | null>(null);
  function update(trip: TripInput) {
    if (operations.busy) return;
    store.getState().update(trip);
    operations.clearAlternatives();
    setDetail(null);
  }
  return {
    ...state,
    ...operations,
    ...persistence,
    detail,
    setDetail,
    update,
    setNotice: store.getState().notify,
    placeFor: (id: string) => findTripPlace(state.places, id),
    switchMode: (mode: TripInput["mode"]) => {
      if (operations.busy || mode === state.trip.mode) return;
      store
        .getState()
        .reset(
          initialTrip(mode, state.trip.date),
          "모드를 바꾸고 새로운 여행 노트를 열었어요.",
        );
      operations.clearAlternatives();
      setDetail(null);
    },
    add: (place: Place) => {
      const trip = store.getState().trip;
      if (
        operations.busy ||
        trip.visits.length >= 5 ||
        trip.visits.some((v) => v.placeId === place.id)
      )
        return;
      store.getState().remember([place]);
      update({
        ...trip,
        visits: [
          ...trip.visits,
          {
            placeId: place.id,
            duration: 60,
            zone: place.category === "관광지" ? "outdoor" : "indoor",
            locked: false,
          },
        ],
      });
    },
    move: (index: number, offset: number) => {
      const trip = store.getState().trip;
      const target = index + offset;
      if (operations.busy || !trip.visits[index] || !trip.visits[target])
        return;
      if (trip.visits[index].locked || trip.visits[target].locked) {
        store.getState().notify("꼭 유지할 방문지의 순서는 바꿀 수 없어요.");
        return;
      }
      const visits = [...trip.visits];
      [visits[index], visits[target]] = [visits[target], visits[index]];
      update({ ...trip, visits });
    },
    applyAlternative: (alternative: Alternative, index: number) => {
      if (!operations.busy && operations.alternatives)
        store
          .getState()
          .applyAlternative(
            operations.alternatives.revision,
            index,
            alternative,
          );
      operations.clearAlternatives();
    },
    undo: () => {
      if (!operations.busy) {
        store.getState().undo();
        operations.clearAlternatives();
      }
    },
  };
}
