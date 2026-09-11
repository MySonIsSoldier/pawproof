import { z } from "zod";
import { tripSchema } from "../../../application/contracts/trip.ts";
import type { TripInput } from "../../../domain/policies/types.ts";

export const tripStorageKey = "pawproof.trip.v1";
const envelopeSchema = z.object({ version: z.literal(1), trip: tripSchema });
type StoragePort = Pick<Storage, "getItem" | "setItem" | "removeItem">;

// Explicit input-only persistence. No Zustand/Query persistence middleware.
export function saveTrip(storage: StoragePort, trip: TripInput) {
  storage.setItem(
    tripStorageKey,
    JSON.stringify({ version: 1, trip: tripSchema.parse(trip) }),
  );
}
export function loadTrip(storage: StoragePort): TripInput | null {
  const raw = storage.getItem(tripStorageKey);
  return raw === null ? null : envelopeSchema.parse(JSON.parse(raw)).trip;
}
export function removeTrip(storage: StoragePort) {
  storage.removeItem(tripStorageKey);
}
