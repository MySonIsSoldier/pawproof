import type {
  Finding,
  Pet,
  Policy,
  Rule,
  RuleKind,
  Status,
  Zone,
} from "./types.ts";
import { toMinutes, weekday } from "../itinerary/time.ts";
import { readableMessage } from "./presentation.ts";

const labels: Record<RuleKind, string> = {
  entry: "선택한 구역의 동반 가능 여부",
  weight: "체중 제한",
  count: "동반 마릿수",
  breed: "견종 제한",
  equipment: "준비사항",
  vaccination: "예방접종 증빙",
  hours: "운영시간",
  closedDays: "방문일 휴무 여부",
};
export function summarize(findings: Finding[]): Status {
  for (const state of ["blocked", "confirm", "prepare"] as const)
    if (findings.some((f) => f.status === state)) return state;
  return "available";
}
type Context = {
  pets: Pet[];
  zone: Zone;
  equipment: string[];
  date: string;
  arrival: number | null;
  duration: number;
};
const normalizeBreed = (value: string) =>
  value.replace(/\s/g, "").toLowerCase();
function hasFinalConsonant(value: string) {
  const last = value.codePointAt(value.length - 1);
  if (last === undefined || last < 0xac00 || last > 0xd7a3) return false;
  return (last - 0xac00) % 28 !== 0;
}
function objectParticle(value: string) {
  return hasFinalConsonant(value) ? "을" : "를";
}
function checkRule(rule: Rule, context: Context): Finding {
  const result = (
    status: Status,
    message: string,
    needs: string[] = [],
  ): Finding => ({
    status,
    kind: rule.kind,
    message,
    quote: rule.quote,
    needs,
  });
  if (rule.operator === "unknown")
    return result(
      "confirm",
      rule.conflict
        ? `출처마다 ${labels[rule.kind]} 조건이 달라 업체 확인이 필요해요.`
        : `${labels[rule.kind]}을 확인해 주세요.`,
    );
  if (rule.kind === "entry")
    return result(
      rule.operator === "deny" ? "blocked" : "available",
      rule.operator === "deny"
        ? "선택한 구역은 반려견 출입이 제한돼요."
        : "선택한 구역에 반려견 동반이 가능해요.",
    );
  if (rule.kind === "vaccination") {
    if (rule.operator === "allow")
      return result("available", "예방접종 증빙이 필수라는 제한은 확인되지 않았어요.");
    return result(
      "confirm",
      "예방접종 증빙을 확인해 주세요. 예방접종 증명서·수첩 원본/사진·건강앱 등 업체가 인정하는 방법을 문의해 주세요.",
      rule.items,
    );
  }
  if (rule.kind === "weight" || rule.kind === "count") {
    if (rule.operator === "allow")
      return result(
        "available",
        `${labels[rule.kind]}: 제한 없음이 명시되어 있어요.`,
      );
    if (rule.value === null)
      return result(
        "confirm",
        `${labels[rule.kind]}의 수치가 명확하지 않아요.`,
      );
    const limit = rule.value;
    const passes = (n: number) =>
      rule.operator === "lt" ? n < limit : n <= limit;
    const failed =
      rule.kind === "weight"
        ? context.pets
            .filter((p) => !passes(p.weight))
            .map((p) => `${p.name} ${p.weight}kg`)
        : passes(context.pets.length)
          ? []
          : [`총 ${context.pets.length}마리`];
    return result(
      failed.length ? "blocked" : "available",
      `${rule.kind === "weight" ? "체중" : "마릿수"} ${limit}${rule.kind === "weight" ? "kg" : "마리"} ${rule.operator === "lt" ? "미만" : "이하"}${failed.length ? ` 조건에 맞지 않아요: ${failed.join(", ")}` : " 조건을 충족해요."}`,
    );
  }
  if (rule.kind === "breed") {
    if (rule.operator === "allow" && !rule.items.length)
      return result("available", "견종 제한 없음이 명시되어 있어요.");
    if (context.pets.some((p) => /모름|믹스|미상|혼종/.test(p.breed)))
      return result(
        "confirm",
        "견종별 제한이 있어 믹스·미상 견종의 이용 여부를 확인해야 해요.",
      );
    const names = rule.items.map(normalizeBreed);
    const failed = context.pets.filter((p) =>
      rule.operator === "deny"
        ? names.includes(normalizeBreed(p.breed))
        : !names.includes(normalizeBreed(p.breed)),
    );
    return result(
      failed.length ? "blocked" : "available",
      failed.length
        ? `${failed.map((p) => p.name).join(", ")}의 견종이 허용 조건에 맞지 않아요.`
        : "명시된 견종 조건을 충족해요.",
    );
  }
  if (rule.kind === "equipment") {
    const missing = rule.items.filter(
      (item) => !context.equipment.includes(item),
    );
    const ready =
      rule.operator === "allow" ||
      (rule.operator === "any"
        ? missing.length < rule.items.length
        : missing.length === 0);
    return result(
      ready ? "available" : "prepare",
      ready
        ? "요구한 준비사항을 충족했어요. 준비 체크는 사용자 확인 기준이에요."
        : rule.operator === "any"
          ? `${missing.join(" 또는 ")} 중 하나를 준비해 주세요.`
          : `${missing.map((item) => `${item}${objectParticle(item)}`).join(", ")} 준비해 주세요.`,
      ready ? [] : missing,
    );
  }
  if (rule.kind === "closedDays") {
    const closed = rule.items.includes(String(weekday(context.date)));
    return result(
      closed ? "blocked" : "available",
      closed
        ? "방문 예정일은 정기 휴무일이에요."
        : "명시된 정기 휴무일에 해당하지 않아요. 임시 휴무는 별도 확인해 주세요.",
    );
  }
  if (context.arrival === null)
    return result(
      "confirm",
      "이동시간이 확인되지 않아 도착 시각과 영업시간을 대조할 수 없어요.",
    );
  const [open, close] = rule.items.map(toMinutes);
  if (!Number.isFinite(open) || !Number.isFinite(close) || close <= open)
    return result("confirm", "운영시간을 직접 확인해 주세요.");
  const fits =
    context.arrival >= open &&
    context.arrival + context.duration <= close &&
    context.arrival < 1440;
  return result(
    fits ? "available" : "blocked",
    fits
      ? "예정된 체류시간이 운영시간 안에 들어와요."
      : `예정 방문·체류가 운영시간 ${rule.items.join("–")}을 벗어나요.`,
  );
}
export function evaluatePolicy(policy: Policy, context: Context): Finding[] {
  const applicable = policy.rules.filter(
    (r) => r.scope === "all" || r.scope === context.zone,
  );
  const entryRules = applicable.filter((r) => r.kind === "entry");
  // A named zone overrides a generic all-zone statement when checking for a
  // source conflict. Keep both findings so the user can see that the place
  // accepts dogs somewhere while the selected zone has a restriction.
  const scopedEntries = entryRules.filter((r) => r.scope === context.zone);
  const consideredEntries = scopedEntries.length ? scopedEntries : entryRules;
  const entryConflict =
    consideredEntries.some((r) => r.operator === "allow") &&
    consideredEntries.some((r) => r.operator === "deny");
  const findings = applicable.map((rule) =>
    checkRule(
      entryConflict && rule.kind === "entry"
        ? { ...rule, operator: "unknown", conflict: true }
        : rule,
      context,
    ),
  );
  for (const notice of policy.notices || []) {
    if (notice.startDate <= context.date && context.date <= notice.endDate)
      findings.push({
        status: "blocked",
        kind: "source",
        message: notice.message,
        quote: notice.quote,
        needs: [],
      });
  }
  for (const kind of (Object.keys(labels) as RuleKind[]).filter(
    (kind) => kind !== "vaccination",
  )) {
    if (!applicable.some((r) => r.kind === kind))
      findings.push({
        status: "confirm",
        kind,
        message: `${labels[kind]} 정보가 없어 확인이 필요해요.`,
        quote: null,
        needs: [],
      });
  }
  for (const message of policy.unresolved)
    findings.push({
      status: "confirm",
      kind: "source",
      message,
      quote: null,
      needs: [],
    });
  const seen = new Set<string>();
  return findings.filter((finding) => {
    // A KTO rule may be emitted once by the LLM and once by the deterministic
    // field parser. Keep the first evidence, but show one user-facing fact.
    // readableMessage also collapses equivalent Korean source phrasings such
    // as the conditional muzzle notice before the signature is calculated.
    const key = [
      finding.status,
      finding.kind,
      readableMessage(finding.message),
      finding.needs.join("\u001f"),
    ].join("\u001e");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
