import { z } from "zod";
import type { Finding, TripInput, TripResult } from "../../domain/policies/types.ts";
import { summarize } from "../../domain/policies/evaluate.ts";

const confirmationKindSchema = z.enum([
  "entry",
  "weight",
  "count",
  "breed",
  "equipment",
  "vaccination",
  "hours",
  "closedDays",
  "source",
  "travel",
]);

export const tripConfirmationSchema = z
  .object({
    placeId: z.string().min(1).max(32),
    kind: confirmationKindSchema,
    findingMessage: z.string().trim().min(1).max(1_000),
    outcome: z.enum(["available", "blocked", "confirm"]),
    answer: z.string().trim().min(1).max(500),
    inputFingerprint: z.string().min(1).max(5_000),
    recordedAt: z.string().datetime(),
  })
  .strict();

export const tripConfirmationsSchema = z.array(tripConfirmationSchema).max(50);
export type TripConfirmation = z.infer<typeof tripConfirmationSchema>;

function confirmationMatches(
  confirmation: TripConfirmation,
  placeId: string,
  finding: Finding,
  inputFingerprint: string,
) {
  return (
    confirmation.inputFingerprint === inputFingerprint &&
    confirmation.placeId === placeId &&
    confirmation.kind === finding.kind &&
    confirmation.findingMessage === finding.message
  );
}

function confirmedMessage(outcome: TripConfirmation["outcome"], answer: string) {
  if (outcome === "available") return `장소에 확인한 답변: ${answer}`;
  if (outcome === "blocked") return `장소에 확인한 답변으로 이용할 수 없어요: ${answer}`;
  return `장소에 답변을 받았지만 아직 확실하지 않아요: ${answer}`;
}

/**
 * Apply only the answers recorded for this exact trip input. The venue policy
 * and the global discovery result remain unchanged for every other note.
 */
export function applyTripConfirmations(
  result: TripResult,
  confirmations: TripConfirmation[],
  input: TripInput,
): TripResult {
  const inputFingerprint = JSON.stringify(input);
  const relevant = confirmations.filter(
    (confirmation) => confirmation.inputFingerprint === inputFingerprint,
  );
  if (!relevant.length) return result;
  return {
    ...result,
    visits: result.visits.map((visit) => {
      const findings = visit.findings.map((finding) => {
        const confirmation = relevant.find((item) =>
          confirmationMatches(
            item,
            visit.place.id,
            finding,
            inputFingerprint,
          ),
        );
        if (!confirmation) return finding;
        return {
          ...finding,
          status: confirmation.outcome,
          message: confirmedMessage(confirmation.outcome, confirmation.answer),
          quote: null,
          needs: [],
        };
      });
      return { ...visit, findings, status: summarize(findings) };
    }),
  };
}
