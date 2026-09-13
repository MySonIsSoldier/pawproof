import { z } from "zod";
import { tripSchema } from "../../../application/contracts/trip.ts";
import {
  tripRecordSchema,
  type TripRecord,
} from "../../../application/contracts/trip-record.ts";
import type { TripInput } from "../../../domain/policies/types.ts";
export const tripStorageKey = "pawproof.trip.v1";
const oldSchema = z.object({ version: z.literal(1), trip: tripSchema });
const envelopeSchema = z.object({
  version: z.literal(2),
  record: tripRecordSchema,
});
type StoragePort = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export function saveTrip(
  storage: StoragePort,
  trip: TripInput,
  record?: TripRecord,
) {
  storage.setItem(
    tripStorageKey,
    JSON.stringify({
      version: 2,
      record: tripRecordSchema.parse(record || { trip }),
    }),
  );
}
export function loadTripRecord(storage: StoragePort): TripRecord | null {
  const raw = storage.getItem(tripStorageKey);
  if (raw === null) return null;
  const value = JSON.parse(raw);
  const old = oldSchema.safeParse(value);
  return old.success
    ? { trip: old.data.trip, places: [], verification: null }
    : envelopeSchema.parse(value).record;
}
export function loadTrip(storage: StoragePort): TripInput | null {
  return loadTripRecord(storage)?.trip || null;
}
export function removeTrip(storage: StoragePort) {
  storage.removeItem(tripStorageKey);
}
