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
      .array(z.string().regex(/^(?:\d{1,12}|mfds-\d+)$/))
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

const inquiryPlaceSchema = placeSchema.pick({
  id: true,
  name: true,
  category: true,
  address: true,
});
const inquiryFindingSchema = z.object({
  status: z.enum(["available", "prepare", "confirm", "blocked"]),
  kind: z.string().max(40),
  message: z.string().max(300),
  needs: z.array(z.string().max(80)).max(10),
}).strict();
export const inquiryInputSchema = z
  .object({
    place: inquiryPlaceSchema,
    date: z.string().regex(/^20\d{2}-\d{2}-\d{2}$/),
    zone: z.enum(["indoor", "outdoor"]),
    pets: z
      .array(
        z.object({
          breed: z.string().trim().min(1).max(40),
          weight: z.number().min(0.1).max(120),
        }).strict(),
      )
      .min(1)
      .max(5),
    findings: z.array(inquiryFindingSchema).max(30),
  })
  .strict();
export const inquiryResultSchema = z.object({
  text: z.string().trim().min(1).max(3000),
  generatedBy: z.enum(["openrouter", "fallback"]),
});
/** OpenRouter adds provider metadata; the inquiry route consumes only content. */
export const inquiryCompletionSchema = z.object({
  choices: z
    .array(z.object({ message: z.object({ content: z.string() }) }))
    .min(1),
});
