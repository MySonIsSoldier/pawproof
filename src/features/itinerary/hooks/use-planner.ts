"use client";

import type { TripRecord } from "../../../application/contracts/trip-record";
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
import { useResolvePlaces } from "./use-resolve-places";
import { useTripOperations } from "./use-trip-operations";
import { usePlannerNotifications } from "./use-planner-notifications";
import { useGuestLeaveWarning } from "./use-guest-leave-warning";
import { trackUmami } from "../../../lib/analytics/umami";

/** Compose UI operations; business policy evaluation remains on the server. */
export function usePlanner() {
  usePlannerNotifications();
  useResolvePlaces();
  const store = useTripStoreApi();
  const state = useTripStore(
    useShallow((s) => ({
      trip: s.trip,
      loading: s.loading,
      historical: !!s.verification?.historical,
      places: s.places,
      result: s.verification?.result || null,
      stale: isTripStale(s),
      previous: s.previous,
      notice: s.notice,
      error: s.error,
    })),
  );
  const operations = useTripOperations();
  useGuestLeaveWarning();
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
    busy: operations.busy || (state.loading ? ("load" as const) : null),
    detail,
    setDetail,
    update,
    restoreTrip: (record: TripRecord) => {
      if (operations.busy) return;
      store.getState().restore(record);
      operations.clearAlternatives();
      setDetail(null);
    },
    copied: (message: string) => {
      trackUmami("inquiry_copy");
      store.getState().succeed(message, "문의 문구를 복사했어요");
    },
    fail: store.getState().fail,
    placeFor: (id: string) => findTripPlace(state.places, id),
    newNote: () => {
      if (operations.busy) return;
      const current = store.getState().trip;
      trackUmami("trip_note_new", { mode: current.mode });
      const start = store.getState().startNote;
      if (start) {
        void start(current.mode).catch((error: Error) =>
          store.getState().fail(error.message),
        );
        return;
      }
      const next = initialTrip(current.mode, current.date);
      store.getState().reset(
        {
          ...next,
          pets: current.pets,
        },
        "새 여행 노트를 열었어요.",
      );
      operations.clearAlternatives();
      setDetail(null);
    },
    switchMode: (mode: TripInput["mode"]) => {
      if (operations.busy || mode === state.trip.mode) return;
      trackUmami("trip_mode_change", { mode });
      const start = store.getState().startNote;
      if (start) {
        void start(mode).catch((error: Error) =>
          store.getState().fail(error.message),
        );
        return;
      }
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
      trackUmami("course_place_add", {
        category: place.category,
        source: place.source,
        course_size: trip.visits.length + 1,
      });
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
      store
        .getState()
        .succeed(
          `${place.name}을(를) 코스에 담았어요.`,
          "코스에 방문지를 담았어요",
        );
    },
    remove: (index: number) => {
      const trip = store.getState().trip;
      const visit = trip.visits[index];
      if (operations.busy || !visit || visit.locked) return;
      update({ ...trip, visits: trip.visits.filter((_, i) => i !== index) });
      store
        .getState()
        .succeed("방문지를 코스에서 뺐어요.", "코스에서 방문지를 뺐어요");
    },
    move: (index: number, offset: number) => {
      const trip = store.getState().trip;
      const target = index + offset;
      if (operations.busy || !trip.visits[index] || !trip.visits[target])
        return;
      if (trip.visits[index].locked || trip.visits[target].locked) {
        store
          .getState()
          .notify(
            "꼭 유지할 방문지의 순서는 바꿀 수 없어요.",
            "유지할 방문지의 순서는 고정돼 있어요",
          );
        return;
      }
      const visits = [...trip.visits];
      [visits[index], visits[target]] = [visits[target], visits[index]];
      update({ ...trip, visits });
      store
        .getState()
        .succeed("방문 순서를 변경했어요.", "방문 순서를 바꿨어요");
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
