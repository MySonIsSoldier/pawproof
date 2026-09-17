import { z } from "zod";
import type { Policy } from "../../domain/policies/types.ts";
export const ruleSchema = z
  .object({
    kind: z.enum([
      "entry",
      "weight",
      "count",
      "breed",
      "equipment",
      "vaccination",
      "hours",
      "closedDays",
    ]),
    scope: z.enum(["all", "indoor", "outdoor"]),
    operator: z.enum(["allow", "deny", "lte", "lt", "all", "any", "unknown"]),
    value: z.number().min(0).max(1440).nullable(),
    items: z.array(z.string().max(80)).max(12),
    quote: z.string().min(1).max(1200),
  })
  .strict();
export const extractionSchema = z
  .object({
    rules: z.array(ruleSchema).max(40),
    unresolved: z.array(z.string().max(300)).max(20),
  })
  .strict();
export type Extraction = z.infer<typeof extractionSchema>;
/** A source document can carry a place; the policy DTO contains only provenance. */
export function createPolicy(
  source: Omit<Policy, "rules" | "unresolved">,
  extraction: Extraction,
): Policy {
  return {
    raw: source.raw,
    sourceLabel: source.sourceLabel,
    sourceUrl: source.sourceUrl,
    fetchedAt: source.fetchedAt,
    modifiedAt: source.modifiedAt,
    rules: extraction.rules,
    unresolved: extraction.unresolved,
  };
}
/** Shape and quoted evidence are checked independently of provider JSON mode. */
export function validateExtraction(value: unknown, raw: string): Extraction {
  const parsed = extractionSchema.parse(value);
  for (const rule of parsed.rules) {
    if (!raw.includes(rule.quote))
      throw new Error("규정의 근거가 원문에 존재하지 않습니다.");
    if (rule.operator === "unknown") continue;
    const allowed = {
      entry: ["allow", "deny"],
      weight: ["allow", "lte", "lt"],
      count: ["allow", "lte", "lt"],
      breed: ["allow", "deny"],
      equipment: ["allow", "all", "any"],
      vaccination: ["allow", "all"],
      hours: ["all"],
      closedDays: ["all"],
    };
    if (!allowed[rule.kind].includes(rule.operator))
      throw new Error("지원하지 않는 규정 연산입니다.");
    if (
      ["weight", "count"].includes(rule.kind) &&
      rule.operator !== "allow" &&
      (rule.value === null ||
        rule.value <= 0 ||
        !rule.quote.includes(String(rule.value)))
    )
      throw new Error("수치 근거가 올바르지 않습니다.");
    if (
      rule.kind === "count" &&
      rule.value !== null &&
      !Number.isInteger(rule.value)
    )
      throw new Error("마릿수는 정수여야 합니다.");
    if (
      rule.kind === "hours" &&
      (rule.items.length !== 2 ||
        rule.items.some((v) => !/^([01]\d|2[0-3]):[0-5]\d$/.test(v)))
    )
      throw new Error("운영시간 형식이 올바르지 않습니다.");
    if (
      rule.kind === "closedDays" &&
      rule.items.some((v) => !/^[0-6]$/.test(v))
    )
      throw new Error("휴무일 형식이 올바르지 않습니다.");
    if (
      ["all", "any"].includes(rule.operator) &&
      rule.kind === "equipment" &&
      !rule.items.length
    )
      throw new Error("준비물 목록이 비어 있습니다.");
    if (rule.kind === "breed" && rule.operator === "deny" && !rule.items.length)
      throw new Error("제한 견종 목록이 비어 있습니다.");
  }
  return parsed;
}

/** Preserve independently valid evidence while keeping any rejected rule unresolved. */
export function validateExtractionWithWarnings(
  value: unknown,
  raw: string,
): Extraction {
  const parsed = extractionSchema.parse(value);
  const rules: Extraction["rules"] = [];
  let rejected = 0;
  for (const rule of parsed.rules) {
    try {
      rules.push(
        ...validateExtraction({ rules: [rule], unresolved: [] }, raw).rules,
      );
    } catch {
      rejected++;
    }
  }
  if (rejected && !rules.length)
    throw new Error("확인 가능한 규정 근거가 없습니다.");
  return {
    rules,
    unresolved: [
      ...parsed.unresolved,
      ...(rejected
        ? [
            `추출한 규정 ${rejected}개의 근거·형식 검증에 실패했어요. 해당 출처의 원문을 확인해 주세요.`,
          ]
        : []),
    ],
  };
}
