import { z } from "zod";
import { extractionSchema, ruleSchema } from "./policy.ts";
import { visitSchema } from "./trip.ts";
export const placeSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(["관광지", "식당", "카페"]),
  address: z.string(),
  lat: z.number().finite(),
  lng: z.number().finite(),
  source: z.enum(["demo", "kto"]),
});
const status = z.enum(["available", "prepare", "confirm", "blocked"]);
const minutes = z.number().finite().nonnegative().nullable();
export const resultSchema = z.object({
  mode: z.enum(["demo", "live"]),
  verifiedAt: z.string(),
  rulesVersion: z.string(),
  totalTravel: minutes,
  travelBasis: z.enum(["demo", "kakao", "unavailable"]),
  visits: z
    .array(
      z.object({
        visit: visitSchema,
        place: placeSchema,
        status,
        arrival: minutes,
        departure: minutes,
        travelMinutes: minutes,
        policy: extractionSchema.extend({
          rules: z
            .array(ruleSchema.extend({ conflict: z.boolean().optional() }))
            .max(160),
          unresolved: z.array(z.string().max(300)).max(60),
          sources: z
            .array(
              z.object({
                label: z.string(),
                url: z.string().nullable(),
                publishedAt: z.string().nullable(),
                accessedAt: z.string(),
                phone: z.string().nullable(),
                raw: z.string(),
              }),
            )
            .max(3)
            .optional(),
          notices: z
            .array(
              z.object({
                startDate: z.iso.date(),
                endDate: z.iso.date(),
                message: z.string(),
                quote: z.string(),
                sourceUrl: z.url(),
                sourceLabel: z.string(),
                checkedAt: z.string(),
              }),
            )
            .max(10)
            .optional(),
          raw: z.string(),
          sourceLabel: z.string(),
          sourceUrl: z.string().nullable(),
          fetchedAt: z.string(),
          modifiedAt: z.string().nullable(),
        }),
        findings: z.array(
          z.object({
            status,
            kind: z.enum([
              "entry",
              "weight",
              "count",
              "breed",
              "equipment",
              "hours",
              "closedDays",
              "source",
              "travel",
            ]),
            message: z.string(),
            quote: z.string().nullable(),
            needs: z.array(z.string()),
          }),
        ),
      }),
    )
    .min(3)
    .max(5),
});
export const searchResultSchema = z.object({
  places: z.array(placeSchema).max(100),
});
export const recoveryResultSchema = z.object({
  alternatives: z
    .array(
      z.object({
        place: placeSchema,
        extraMinutes: z.number().finite(),
        result: resultSchema,
      }),
    )
    .max(3),
  inspected: z.number().int().nonnegative(),
});
