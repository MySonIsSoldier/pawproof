"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useStore } from "zustand";

import type { TripInput } from "../../../domain/policies/types";
import {
  createTripStore,
  type TripStore,
  type TripStoreState,
} from "./trip-store";

const StoreContext = createContext<TripStore | null>(null);
export function PlannerProvider({
  initialTrip,
  children,
}: {
  initialTrip: TripInput;
  children: ReactNode;
}) {
  const [store] = useState(() => createTripStore(initialTrip));
  return (
    <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
  );
}
export function useTripStoreApi() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("PlannerProvider is required.");
  return store;
}
export function useTripStore<T>(selector: (state: TripStoreState) => T): T {
  return useStore(useTripStoreApi(), selector);
}
