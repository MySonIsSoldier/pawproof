import { createStore } from "zustand/vanilla";
import type {
  Place,
  TripInput,
  TripResult,
} from "../../../domain/policies/types.ts";
import type { Alternative } from "../../../application/use-cases/recover-trip.ts";
import { demoPlaces } from "../../../fixtures/demo-trip.ts";

type Verification = { fingerprint: string; result: TripResult };
type TripState = {
  trip: TripInput;
  revision: number;
  places: Record<string, Place>;
  verification: Verification | null;
  previous: { trip: TripInput; verification: Verification | null } | null;
  notice: string;
  error: string;
};
type TripActions = {
  update: (trip: TripInput) => void;
  reset: (trip: TripInput, notice: string) => void;
  remember: (places: Place[]) => void;
  acceptVerification: (revision: number, result: TripResult) => boolean;
  applyAlternative: (
    revision: number,
    index: number,
    alternative: Alternative,
  ) => void;
  undo: () => void;
  notify: (notice: string) => void;
  fail: (error: string) => void;
  clearFeedback: () => void;
};
export type TripStoreState = TripState & TripActions;
const placeIndex = (places: Place[]) =>
  Object.fromEntries(places.map((place) => [place.id, place]));

/** One store per mounted planner. No browser storage, API calls or shared SSR state. */
export function createTripStore(trip: TripInput) {
  return createStore<TripStoreState>()((set, get) => ({
    trip,
    revision: 0,
    places: trip.mode === "demo" ? placeIndex(demoPlaces) : {},
    verification: null,
    previous: null,
    notice: "",
    error: "",
    update: (next) =>
      set((state) => ({
        trip: next,
        revision: state.revision + 1,
        previous: null,
        notice: "",
        error: "",
      })),
    reset: (next, notice) =>
      set((state) => ({
        trip: next,
        revision: state.revision + 1,
        places: next.mode === "demo" ? placeIndex(demoPlaces) : {},
        verification: null,
        previous: null,
        notice,
        error: "",
      })),
    remember: (places) =>
      set((state) => ({ places: { ...state.places, ...placeIndex(places) } })),
    acceptVerification: (revision, result) => {
      const state = get();
      if (state.revision !== revision) return false;
      set({
        verification: { fingerprint: JSON.stringify(state.trip), result },
        places: {
          ...state.places,
          ...placeIndex(result.visits.map((v) => v.place)),
        },
        notice: "코스 검사가 끝났어요. 방문지별 조건과 근거를 살펴보세요.",
        error: "",
      });
      return true;
    },
    applyAlternative: (revision, index, alternative) => {
      const state = get();
      if (
        revision !== state.revision ||
        isTripStale(state) ||
        !state.verification ||
        !state.trip.visits[index] ||
        state.trip.visits[index].locked
      )
        return;
      const next = {
        ...state.trip,
        visits: state.trip.visits.map((v, i) =>
          i === index ? { ...v, placeId: alternative.place.id } : v,
        ),
      };
      set({
        previous: { trip: state.trip, verification: state.verification },
        trip: next,
        revision: state.revision + 1,
        verification: {
          fingerprint: JSON.stringify(next),
          result: alternative.result,
        },
        places: {
          ...state.places,
          ...placeIndex(alternative.result.visits.map((v) => v.place)),
        },
        notice: `${alternative.place.name}(으)로 바꾸고 이후 일정까지 다시 검사했어요.`,
        error: "",
      });
    },
    undo: () => {
      const state = get();
      if (!state.previous) return;
      set({
        ...state.previous,
        revision: state.revision + 1,
        previous: null,
        notice: "교체 전 코스로 되돌렸어요.",
        error: "",
      });
    },
    notify: (notice) => set({ notice, error: "" }),
    fail: (error) => set({ error, notice: "" }),
    clearFeedback: () => set({ notice: "", error: "" }),
  }));
}
export type TripStore = ReturnType<typeof createTripStore>;
export function isTripStale(state: TripState): boolean {
  return (
    state.verification !== null &&
    state.verification.fingerprint !== JSON.stringify(state.trip)
  );
}
export function findTripPlace(
  places: Record<string, Place>,
  id: string,
): Place {
  return (
    places[id] || {
      id,
      name: `장소 ${id}`,
      address: "다시 검사하면 현재 장소 정보를 불러와요.",
      category: "관광지",
      lat: 0,
      lng: 0,
      source: "kto",
    }
  );
}
