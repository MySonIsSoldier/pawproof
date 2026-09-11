import type { Providers, PlaceDocument } from "../ports/providers.ts";
import type { Policy, TripInput, TripResult, VisitResult } from "../../domain/policies/types.ts";
import { evaluatePolicy, summarize } from "../../domain/policies/evaluate.ts";
import { toMinutes } from "../../domain/itinerary/time.ts";

export async function verifyTrip(input: TripInput, providers: Providers, now = new Date()): Promise<TripResult> {
  const documents = new Map<string, { document: PlaceDocument; policy: Policy }>();
  // Two workers bound external concurrency; no cross-request policy cache.
  const pending = [...input.visits];
  await Promise.all([0, 1].map(async () => {
    for (let visit = pending.shift(); visit; visit = pending.shift()) {
      const document = await providers.places.get(visit.placeId);
      let policy: Policy;
      try { policy = await providers.extractor.extract(document); }
      catch { policy = { ...document, rules: [], unresolved: ["규정을 해석하지 못했어요. 원문을 확인하거나 다시 검사해 주세요."] }; }
      documents.set(visit.placeId, { document, policy });
    }
  }));
  const visits: VisitResult[] = [];
  let cursor: number | null = toMinutes(input.startTime);
  let totalTravel: number | null = 0;
  for (const visit of input.visits) {
    const { document, policy } = documents.get(visit.placeId)!;
    const previous = visits.at(-1);
    const travelMinutes = previous ? await providers.travel.minutes(previous.place, document.place).catch(() => null) : 0;
    if (travelMinutes === null) { cursor = null; totalTravel = null; }
    else { if (cursor !== null) cursor += travelMinutes; if (totalTravel !== null) totalTravel += travelMinutes; }
    const findings = evaluatePolicy(policy, { ...input, zone: visit.zone, arrival: cursor, duration: visit.duration });
    if (travelMinutes === null) findings.push({ kind: "travel", status: "confirm", message: "자동차 이동시간을 확인하지 못했어요. 이후 도착 시각은 미확정이에요.", quote: null, needs: [] });
    const departure: number | null = cursor === null ? null : cursor + visit.duration;
    visits.push({ visit, place: document.place, policy, status: summarize(findings), findings, arrival: cursor, departure, travelMinutes });
    cursor = departure;
  }
  return { mode: input.mode, verifiedAt: now.toISOString(), rulesVersion: "2026-09-11.1", visits, totalTravel, travelBasis: providers.travel.basis };
}
