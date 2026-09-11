import { test } from "node:test";
import assert from "node:assert/strict";
import { validateExtractionWithWarnings } from "../../src/application/contracts/policy.ts";
import { mergePolicies } from "../../src/domain/policies/merge.ts";
import {
  evaluatePolicy,
  summarize,
} from "../../src/domain/policies/evaluate.ts";
import { incheonSupplements } from "../../src/infrastructure/incheon/supplements.ts";
import { enrichedExtractor } from "../../src/application/use-cases/enrich-policy.ts";
import {
  demoPolicy,
  demoPlaces,
} from "../../src/infrastructure/demo/catalog.ts";
import type { Policy, Rule, Place } from "../../src/domain/policies/types.ts";

const rule = (
  kind: Rule["kind"],
  operator: Rule["operator"],
  value: number | null,
  quote: string,
): Rule => ({ kind, operator, value, quote, items: [], scope: "all" });
const policy = (rules: Rule[]): Policy => ({
  ...demoPolicy("demo-table"),
  rules,
  raw: rules.map((r) => r.quote).join("\n"),
  unresolved: [],
});
const evidence = {
  label: "합성 지자체",
  url: null,
  publishedAt: "2026-01-19",
  accessedAt: "2026-09-11",
  phone: null,
  raw: "20kg 이하",
};
const context = {
  pets: [{ name: "검증견", breed: "푸들", weight: 18 }],
  zone: "outdoor" as const,
  equipment: [],
  date: "2026-09-12",
  arrival: 780,
  duration: 30,
};
test("conflicting weight limits remain unknown rather than blocking or allowing", () => {
  const merged = mergePolicies(
    policy([rule("weight", "lte", 17, "17kg 이하")]),
    policy([rule("weight", "lte", 20, "20kg 이하")]),
    evidence,
  );
  assert.ok(merged.rules.every((r) => r.operator === "unknown"));
  assert.ok(merged.rules.every((r) => r.conflict));
  assert.ok(
    !evaluatePolicy(merged, context).some((f) => f.status === "blocked"),
  );
});
test("a missing kind is filled with evidence, without inventing unrelated unlimited conditions", () => {
  const merged = mergePolicies(
    policy([rule("entry", "allow", null, "실외 동반")]),
    policy([rule("weight", "lte", 20, "20kg 이하")]),
    evidence,
  );
  assert.ok(
    evaluatePolicy(merged, context).some(
      (f) => f.kind === "weight" && f.status === "available",
    ),
  );
  assert.ok(
    evaluatePolicy(merged, context).some(
      (f) => f.kind === "count" && f.status === "confirm",
    ),
  );
});
test("conflicts in one zone do not erase an independent restriction in another", () => {
  const a = policy([
    { ...rule("entry", "allow", null, "실외 허용"), scope: "outdoor" },
    { ...rule("entry", "deny", null, "실내 금지"), scope: "indoor" },
  ]);
  const b = policy([
    { ...rule("entry", "deny", null, "실외 금지"), scope: "outdoor" },
  ]);
  const merged = mergePolicies(a, b, evidence);
  assert.equal(
    merged.rules.find((r) => r.scope === "indoor")?.operator,
    "deny",
  );
  assert.ok(
    merged.rules
      .filter((r) => r.scope === "outdoor")
      .every((r) => r.operator === "unknown"),
  );
});
const park: Place = {
  ...demoPlaces[0],
  id: "2767886",
  name: "송도 도그파크",
  address: "인천광역시 연수구 센트럴로 350 (송도동)",
  source: "kto",
};
test("reviewed joins require ID, name, city and exact street number", () => {
  const source = incheonSupplements(new Date("2026-09-11T00:00:00Z"));
  assert.equal(source.find(park).documents.length, 1);
  for (const changed of [
    { name: "다른 지점" },
    { address: "인천광역시 연수구 센트럴로 3500" },
    { address: "인천광역시 연수구 센트럴로 350-1" },
    { address: "서울특별시 센트럴로 350" },
    { address: "인천광역시 연수구 신센트럴로 350" },
  ]) {
    const result = source.find({ ...park, ...changed });
    assert.equal(result.documents.length, 0);
    assert.equal(result.warnings.length, 1);
  }
  assert.equal(source.find({ ...park, source: "demo" }).documents.length, 0);
});
test("a dated closure applies only on its published date, even when extraction fails", async () => {
  const extractor = enrichedExtractor(
    {
      extract: async () => {
        throw new Error("unavailable");
      },
    },
    incheonSupplements(new Date("2026-09-11T00:00:00Z")),
  );
  const result = await extractor.extract({ ...policy([]), place: park });
  assert.equal(result.sources?.length, 2);
  assert.equal(result.notices?.length, 1);
  assert.equal(summarize(evaluatePolicy(result, context)), "blocked");
  for (const date of ["2026-09-11", "2026-09-13"])
    assert.equal(
      summarize(evaluatePolicy(result, { ...context, date })),
      "confirm",
    );
});
test("municipal records stop affecting policy after their next publication deadline", () => {
  const result = incheonSupplements(new Date("2027-01-19T00:00:00Z")).find(
    park,
  );
  assert.equal(result.documents.length, 0);
  assert.equal(result.warnings.length, 1);
});

test("one fabricated quote preserves valid rules but cannot produce an available result", () => {
  const base = demoPolicy("demo-table");
  const extraction = validateExtractionWithWarnings(
    {
      rules: [...base.rules, rule("weight", "lte", 100, "fabricated 100kg")],
      unresolved: [],
    },
    base.raw,
  );
  assert.equal(extraction.rules.length, base.rules.length);
  assert.equal(extraction.unresolved.length, 1);
  const findings = evaluatePolicy(
    { ...base, ...extraction },
    {
      ...context,
      pets: [{ name: "두부", breed: "푸들", weight: 1 }],
      equipment: ["목줄"],
    },
  );
  assert.ok(
    findings.some((f) => f.kind === "source" && f.status === "confirm"),
  );
});

test("contradictory entry claims in the same source stay uncertain", () => {
  const findings = evaluatePolicy(
    policy([
      rule("entry", "allow", null, "동반 가능"),
      rule("entry", "deny", null, "동반 불가"),
    ]),
    context,
  );
  assert.ok(
    findings
      .filter((f) => f.kind === "entry")
      .every((f) => f.status === "confirm"),
  );
  assert.ok(!findings.some((f) => f.status === "blocked"));
});
