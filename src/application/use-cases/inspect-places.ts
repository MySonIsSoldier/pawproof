import type { Providers } from "../ports/providers.ts";
import type { Inspection } from "../contracts/discovery.ts";
import { createPolicy } from "../contracts/policy.ts";
import { addKtoFacts } from "../../domain/policies/kto-facts.ts";

export async function inspectPlaces(ids: string[], providers: Providers) {
  const pending = [...ids];
  const checks: Inspection[] = [];
  const failedIds: string[] = [];
  await Promise.all(
    [0, 1].map(async () => {
      for (let id = pending.shift(); id; id = pending.shift()) {
        try {
          const document = await providers.places.get(id);
          let policy;
          try {
            if (!document.raw.trim()) throw new Error("No policy");
            policy = await providers.extractor.extract(document);
          } catch {
            policy = createPolicy(document, {
              rules: [],
              unresolved: [
                "규정을 확인하지 못했어요. 업체 안내를 확인해 주세요.",
              ],
            });
          }
          if (document.place.source === "kto") policy = addKtoFacts(policy);
          checks.push({
            place: document.place,
            policy,
            phone: document.phone ?? null,
          });
        } catch {
          failedIds.push(id);
        }
      }
    }),
  );
  return { checks, failedIds };
}
