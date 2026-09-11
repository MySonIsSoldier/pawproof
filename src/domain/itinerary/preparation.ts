import type { TripResult } from "../policies/types.ts";
export type PreparationTask = {
  label: string;
  sources: { place: string; quote: string | null }[];
};
export function buildPreparation(result: TripResult): PreparationTask[] {
  const tasks = new Map<string, PreparationTask>();
  for (const visit of result.visits) {
    for (const finding of visit.findings.filter(
      (f) => f.status === "prepare",
    )) {
      const rule = visit.policy.rules.find(
        (r) => r.kind === "equipment" && r.quote === finding.quote,
      );
      const groups =
        rule?.operator === "any"
          ? [finding.needs.toSorted()]
          : finding.needs.map((item) => [item]);
      for (const group of groups) {
        const label =
          group.length > 1 ? `${group.join(" 또는 ")} 중 하나` : group[0];
        const task = tasks.get(label) || { label, sources: [] };
        if (
          !task.sources.some(
            (source) =>
              source.place === visit.place.name &&
              source.quote === finding.quote,
          )
        )
          task.sources.push({ place: visit.place.name, quote: finding.quote });
        tasks.set(label, task);
      }
    }
  }
  return [...tasks.values()];
}
