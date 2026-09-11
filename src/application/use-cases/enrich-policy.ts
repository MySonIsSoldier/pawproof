import type {
  PlaceDocument,
  PolicySupplementSource,
  RuleExtractor,
} from "../ports/providers.ts";
import { createPolicy } from "../contracts/policy.ts";
import { mergePolicies } from "../../domain/policies/merge.ts";

export function enrichedExtractor(
  base: RuleExtractor,
  supplements: PolicySupplementSource,
): RuleExtractor {
  const extract = async (document: PlaceDocument) => {
    try {
      return await base.extract(document);
    } catch {
      return createPolicy(document, {
        rules: [],
        unresolved: [
          `${document.sourceLabel}: 규정을 해석하지 못했어요. 원문 확인이 필요해요.`,
        ],
      });
    }
  };
  return {
    extract: async (document) => {
      const additional = supplements.find(document.place);
      let policy = await extract(document);
      policy.sources = [
        {
          label: document.sourceLabel,
          url: document.sourceUrl,
          publishedAt: document.modifiedAt,
          accessedAt: document.fetchedAt,
          phone: document.phone || null,
          raw: document.raw,
        },
      ];
      for (const source of additional.documents) {
        if (!source.raw.trim()) {
          policy.sources = [...(policy.sources || []), source.evidence];
          policy.unresolved.push(
            "인천시 목록에도 동반 규정·운영시간이 미집계되어 있어요.",
          );
          continue;
        }
        policy = mergePolicies(policy, await extract(source), source.evidence);
      }
      return {
        ...policy,
        notices: additional.notices,
        unresolved: [...policy.unresolved, ...additional.warnings],
      };
    },
  };
}
