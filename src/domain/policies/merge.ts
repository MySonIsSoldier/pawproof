import type { Policy, PolicySource, Rule, Zone } from "./types.ts";

const signature = (rule: Rule) =>
  JSON.stringify([rule.operator, rule.value, [...rule.items].sort()]);

/** Conflicting sources cannot become a stricter prohibition or a blanket permission. */
export function mergePolicies(
  primary: Policy,
  supplement: Policy,
  evidence: PolicySource,
): Policy {
  const rules: Rule[] = [];
  for (const zone of ["indoor", "outdoor"] as Zone[]) {
    const applies = (r: Rule) => r.scope === "all" || r.scope === zone;
    const first = primary.rules.filter(applies);
    const second = supplement.rules.filter(applies);
    const kinds = new Set([...first, ...second].map((r) => r.kind));
    for (const kind of kinds) {
      const a = first.filter((r) => r.kind === kind);
      const b = second.filter((r) => r.kind === kind);
      const signatures = (items: Rule[]) =>
        [...new Set(items.map(signature))].sort().join(";");
      const conflict =
        a.length > 0 && b.length > 0 && signatures(a) !== signatures(b);
      const seen = new Set<string>();
      for (const rule of [...a, ...b]) {
        const key = `${signature(rule)}:${rule.quote}`;
        if (seen.has(key)) continue;
        seen.add(key);
        rules.push({
          ...rule,
          scope: zone,
          operator: conflict ? "unknown" : rule.operator,
          ...(conflict ? { conflict: true } : {}),
        });
      }
    }
  }
  return {
    ...primary,
    rules,
    unresolved: [...new Set([...primary.unresolved, ...supplement.unresolved])],
    raw: `${primary.raw}\n\n[${evidence.label} · ${evidence.publishedAt}]\n${supplement.raw}`,
    sources: [...(primary.sources || []), evidence],
  };
}
