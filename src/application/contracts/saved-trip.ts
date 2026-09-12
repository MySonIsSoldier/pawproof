import { z } from "zod";
import { tripSchema } from "./trip.ts";
export const tripIdSchema = z.string().uuid();
export const saveTripSchema = z
  .object({
    title: z.string().trim().min(1).max(60),
    trip: tripSchema,
    expectedRevision: z.number().int().min(0).max(1_000_000),
  })
  .strict();
export const deleteTripSchema = z
  .object({ expectedRevision: z.number().int().min(1) })
  .strict();
export const savedTripSchema = z
  .object({
    id: tripIdSchema,
    title: z.string().max(60),
    trip: tripSchema,
    revision: z.number().int().min(1),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict();
export const savedTripListSchema = z.array(savedTripSchema).max(20);
export type SavedTrip = z.infer<typeof savedTripSchema>;
export type SaveTripInput = z.infer<typeof saveTripSchema>;
