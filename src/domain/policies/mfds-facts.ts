import type { Policy, Rule } from "./types.ts";

function addRule(rules: Rule[], next: Rule) {
  if (
    !rules.some(
      (rule) =>
        rule.kind === next.kind &&
        rule.scope === next.scope &&
        rule.operator === next.operator &&
        rule.quote === next.quote,
    )
  )
    rules.push(next);
}

/** The official list confirms a participating venue, not its full house policy. */
export function addMfdsFacts(policy: Policy): Policy {
  const rules = [...policy.rules];
  const unresolved = new Set(policy.unresolved);
  const quote = policy.raw
    .split(/\r?\n/)
    .find((line) => line.startsWith("식품안전나라 반려동물 동반출입 음식점 목록"));
  if (quote) {
    addRule(rules, {
      kind: "entry",
      scope: "all",
      operator: "allow",
      value: null,
      items: [],
      quote,
    });
  }
  unresolved.add(
    "식약처 목록에 등재된 업소지만 실내·테라스·체중·마릿수·견종·예약 조건은 방문 전에 업소에 확인해 주세요.",
  );
  return { ...policy, rules, unresolved: [...unresolved] };
}
