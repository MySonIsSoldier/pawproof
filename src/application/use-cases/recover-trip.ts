import type { Providers } from "../ports/providers.ts";
import type {
  Place,
  TripInput,
  TripResult,
} from "../../domain/policies/types.ts";
import { verifyTrip } from "./verify-trip.ts";
export type Alternative = {
  place: Place;
  extraMinutes: number;
  result: TripResult;
};
export async function recoverTrip(
  input: TripInput,
  index: number,
  providers: Providers,
): Promise<{ alternatives: Alternative[]; inspected: number }> {
  if (!input.visits[index] || input.visits[index].locked)
    throw new Error("고정한 방문지는 교체할 수 없어요.");
  // This memo only lives inside this recovery request and is not a shared cache.
  const documents = new Map<string, ReturnType<Providers["places"]["get"]>>();
  const policies = new Map<
    string,
    ReturnType<Providers["extractor"]["extract"]>
  >();
  const routes = new Map<string, Promise<number | null>>();
  const scoped: Providers = {
    ...providers,
    places: {
      search: (...args) => providers.places.search(...args),
      nearby: (p) => providers.places.nearby(p),
      get: (id) => {
        if (!documents.has(id)) documents.set(id, providers.places.get(id));
        return documents.get(id)!;
      },
    },
    extractor: {
      extract: (doc) => {
        if (!policies.has(doc.place.id))
          policies.set(doc.place.id, providers.extractor.extract(doc));
        return policies.get(doc.place.id)!;
      },
    },
    travel: {
      basis: providers.travel.basis,
      minutes: (a, b) => {
        const key = `${a.id}:${b.id}`;
        if (!routes.has(key)) routes.set(key, providers.travel.minutes(a, b));
        return routes.get(key)!;
      },
    },
  };
  const baseline = await verifyTrip(input, scoped);
  const candidates = (
    await providers.places.nearby(baseline.visits[index].place)
  )
    .filter(
      (p) =>
        p.category === baseline.visits[index].place.category &&
        !input.visits.some((v) => v.placeId === p.id),
    )
    .slice(0, 3);
  const alternatives: Alternative[] = [];
  for (const place of candidates) {
    const changed = {
      ...input,
      visits: input.visits.map((v, i) =>
        i === index ? { ...v, placeId: place.id } : v,
      ),
    };
    try {
      const result = await verifyTrip(changed, scoped);
      if (
        !["available", "prepare"].includes(result.visits[index].status) ||
        result.totalTravel === null ||
        baseline.totalTravel === null
      )
        continue;
      const invalid = result.visits.some(
        (v, i) =>
          i !== index &&
          ((v.status === "blocked" &&
            baseline.visits[i].status !== "blocked") ||
            (v.status === "confirm" &&
              ["available", "prepare"].includes(baseline.visits[i].status)) ||
            (input.visits[i].locked &&
              v.arrival !== baseline.visits[i].arrival)),
      );
      if (!invalid)
        alternatives.push({
          place,
          result,
          extraMinutes: result.totalTravel - baseline.totalTravel,
        });
    } catch {
      /* An unavailable candidate is not promoted to an eligible alternative. */
    }
  }
  return {
    alternatives: alternatives.sort((a, b) => a.extraMinutes - b.extraMinutes),
    inspected: candidates.length,
  };
}
