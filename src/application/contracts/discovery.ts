import { z } from "zod";
import { resultSchema, placeSchema } from "./result.ts";
export const nearbyQuerySchema = z.object({
  lat: z.coerce.number().min(32).max(39.5),
  lng: z.coerce.number().min(124).max(132),
  radius: z.coerce.number().int().min(1000).max(20000).default(5000),
  category: z.enum(["관광지", "식당", "카페"]).optional(),
});
export const inspectInputSchema = z
  .object({
    ids: z
      .array(z.string().regex(/^\d{1,12}$/))
      .min(1)
      .max(5),
  })
  .strict()
  .refine(({ ids }) => new Set(ids).size === ids.length);
export const inspectionSchema = z.object({
  place: placeSchema,
  policy: resultSchema.shape.visits.element.shape.policy,
  phone: z.string().nullable(),
});
export const inspectionsSchema = z.object({
  checks: z.array(inspectionSchema).max(5),
  failedIds: z.array(z.string()).max(5),
});
export type Inspection = z.infer<typeof inspectionSchema>;
