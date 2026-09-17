import { z } from "zod";
import { tripSchema, visitSchema } from "./trip.ts";
import { resultSchema, placeSchema } from "./result.ts";
import type { TripResult } from "../../domain/policies/types.ts";
// Drafts may be incomplete; the verification endpoint still requires the strict tripSchema.
export const draftTripSchema = tripSchema.safeExtend({
  pets: z
    .array(
      z
        .object({
          name: z.string().max(20),
          breed: z.string().max(40),
          weight: z.number().min(0).max(120),
        })
        .strict(),
    )
    .min(1)
    .max(5),
  visits: z.array(visitSchema).max(5),
});
const resultVisit = resultSchema.shape.visits.element;
const summarySchema = resultSchema
  .omit({ visits: true })
  .extend({
    visits: z
      .array(
        resultVisit
          .omit({ policy: true, findings: true })
          .extend({
            findings: z
              .array(
                resultVisit.shape.findings.element
                  .omit({ quote: true })
                  .extend({
                    message: z.string().max(1000),
                    needs: z.array(z.string().max(100)).max(20),
                  })
                  .strict(),
              )
              .max(100),
          })
          .strict(),
      )
      .min(1)
      .max(5),
  })
  .strict();
export const verificationRecordSchema = z
  .object({ input: tripSchema, result: summarySchema })
  .strict()
  .refine(
    ({ input, result }) =>
      input.mode === result.mode &&
      JSON.stringify(input.visits) ===
        JSON.stringify(result.visits.map((v) => v.visit)),
    "검사한 방문지와 결과가 일치하지 않아요.",
  );
export const tripRecordSchema = z
  .object({
    trip: draftTripSchema,
    places: z
      .array(
        placeSchema
          .extend({ name: z.string().max(200), address: z.string().max(500) })
          .strict(),
      )
      .max(5)
      .default([]),
    verification: verificationRecordSchema.nullable().default(null),
  })
  .strict()
  .refine(
    ({ trip, places }) =>
      new Set(places.map((p) => p.id)).size === places.length &&
      places.every(
        (p) =>
          trip.visits.some((v) => v.placeId === p.id) &&
          (trip.mode === "demo" ? p.source === "demo" : p.source === "kto"),
      ),
    "장소 표시 정보가 코스와 일치하지 않아요.",
  );
export type TripRecord = z.infer<typeof tripRecordSchema>;
export function recordVerification(input: unknown, result: TripResult) {
  return verificationRecordSchema.parse({
    input,
    result: {
      ...result,
      visits: result.visits.map(({ policy: _policy, findings, ...visit }) => {
        void _policy;
        return {
          ...visit,
          findings: findings.map(({ quote: _quote, ...finding }) => {
            void _quote;
            return finding;
          }),
        };
      }),
    },
  });
}
export function restoreVerification(
  record: NonNullable<TripRecord["verification"]>,
): TripResult {
  return {
    ...record.result,
    visits: record.result.visits.map((visit) => ({
      ...visit,
      findings: visit.findings.map((f) => ({ ...f, quote: null })),
      policy: {
        rules: [],
        unresolved: [],
        raw: "",
        sourceLabel: "저장 당시 검사 요약 · 원문은 재검사 후 확인",
        sourceUrl: null,
        fetchedAt: record.result.verifiedAt,
        modifiedAt: null,
      },
    })),
  };
}
