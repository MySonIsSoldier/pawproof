"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useStore } from "zustand";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            staleTime: 0,
            gcTime: 0,
            networkMode: "always",
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            refetchOnMount: false,
          },
          mutations: { retry: false, gcTime: 0, networkMode: "always" },
        },
      }),
  );
  return (
    <StoreContext.Provider value={store}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
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
