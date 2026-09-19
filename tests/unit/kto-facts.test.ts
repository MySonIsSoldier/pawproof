import { test } from "node:test";
import assert from "node:assert/strict";
import { addKtoFacts } from "../../src/domain/policies/kto-facts.ts";
import { demoPolicy } from "../../src/infrastructure/demo/catalog.ts";
import { evaluatePolicy, summarize } from "../../src/domain/policies/evaluate.ts";

test("KTO pet-tour facts keep known entry and preparation rules deterministic", () => {
  const policy = addKtoFacts({
    ...demoPolicy("demo-table"),
    raw: [
      "동반 가능 구역: 전구역 동반가능",
      "동반 가능한 반려동물: 전 견종 동반 가능",
      "방문객 준비사항: 목줄 착용,이동장(켄넬)사용",
      "추가 동반 안내: - 맹견의 경우, 입마개 착용 필수\n- 배변봉투 지참 및 배변처리 필수",
    ].join("\n"),
    rules: [],
    unresolved: [],
  });
  assert.ok(policy.rules.some((rule) => rule.kind === "entry" && rule.operator === "allow"));
  assert.ok(policy.rules.some((rule) => rule.kind === "breed" && rule.operator === "allow"));
  assert.ok(policy.rules.some((rule) => rule.kind === "equipment" && rule.items.includes("목줄")));
  assert.ok(policy.rules.some((rule) => rule.kind === "equipment" && rule.items.includes("배변봉투")));
  assert.ok(policy.unresolved.some((message) => message.includes("맹견이라면")));
});

test("partial KTO entry area remains usable but asks for the exact zone", () => {
  const policy = addKtoFacts({
    ...demoPolicy("demo-table"),
    raw: "동반 가능 구역: 일부구역 동반가능",
    rules: [],
    unresolved: [],
  });
  assert.equal(policy.rules[0]?.operator, "allow");
  assert.ok(policy.unresolved.some((message) => message.includes("일부")));
});

test("named indoor denial does not block an outdoor visit", () => {
  const policy = addKtoFacts({
    ...demoPolicy("demo-table"),
    raw: "동반 가능 구역: 일부구역 동반가능\n추가 동반 안내: - 가옥 안쪽은 동반 불가",
    rules: [
      {
        kind: "entry",
        scope: "all",
        operator: "deny",
        value: null,
        items: ["가옥 안쪽"],
        quote: "가옥 안쪽은 동반 불가",
      },
    ],
    unresolved: [],
  });
  const entry = policy.rules.find(
    (rule) => rule.kind === "entry" && rule.operator === "deny",
  );
  assert.equal(entry?.scope, "indoor");
  const context = {
    pets: [{ name: "두부", breed: "코기", weight: 10 }],
    equipment: ["목줄"],
    date: "2026-09-20",
    arrival: 600,
    duration: 60,
  };
  assert.notEqual(
    summarize(evaluatePolicy(policy, { ...context, zone: "outdoor" })),
    "blocked",
  );
  assert.equal(
    summarize(evaluatePolicy(policy, { ...context, zone: "indoor" })),
    "confirm",
  );
});
