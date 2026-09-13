import { z } from "zod";
import { tripRecordSchema } from "./trip-record.ts";
export const tripIdSchema = z.string().uuid();
export const saveTripSchema = tripRecordSchema.safeExtend({
  title: z.string().trim().min(1).max(60),
  expectedRevision: z.number().int().min(0).max(1_000_000),
});
export const deleteTripSchema = z
  .object({ expectedRevision: z.number().int().min(1) })
  .strict();
export const savedTripSchema = tripRecordSchema.safeExtend({
  id: tripIdSchema,
  title: z.string().max(60),
  revision: z.number().int().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export const savedTripListSchema = z.array(savedTripSchema).max(20);
export type SavedTrip = z.infer<typeof savedTripSchema>;
export type SaveTripInput = z.infer<typeof saveTripSchema>;
