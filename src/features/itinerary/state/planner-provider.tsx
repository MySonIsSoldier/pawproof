"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useStore } from "zustand";
import { useAuth } from "../../auth/auth-provider";

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
  const { user } = useAuth();
  const owner = user?.uid ?? null;
  const [session, setSession] = useState(() => ({
    owner,
    store: createTripStore(initialTrip),
  }));
  // Adopt guest work on login, but never carry one account's work into another.
  if (session.owner !== owner) {
    setSession({
      owner,
      store: session.owner ? createTripStore(initialTrip) : session.store,
    });
  }
  return (
    <StoreContext.Provider value={session.store}>
      {children}
    </StoreContext.Provider>
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
