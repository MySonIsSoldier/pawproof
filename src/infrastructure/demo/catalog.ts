import {
  demoPlaces,
  createDemoTrip as createTrip,
} from "../../fixtures/demo-trip.ts";
export { demoPlaces } from "../../fixtures/demo-trip.ts";
import type { Policy, Rule, TripInput } from "../../domain/policies/types.ts";
import { koreaToday } from "../../domain/itinerary/time.ts";
import type { Providers } from "../../application/ports/providers.ts";

function rule(
  kind: Rule["kind"],
  quote: string,
  extra: Partial<Rule> = {},
): Rule {
  return {
    kind,
    scope: "all",
    operator: "allow",
    value: null,
    items: [],
    quote,
    ...extra,
  };
}
export function demoPolicy(id: string): Policy {
  const rules: Rule[] = [
    rule("entry", "반려견은 실내와 실외 모두 동반 가능합니다."),
    rule("weight", "체중 제한 없이 동반 가능합니다."),
    rule("count", "마릿수 제한 없이 동반 가능합니다."),
    rule("breed", "견종 제한 없이 동반 가능합니다."),
    rule("equipment", "목줄 착용은 필수입니다.", {
      operator: "all",
      items: ["목줄"],
    }),
    rule("hours", "운영시간은 09:00부터 19:00까지입니다.", {
      operator: "all",
      items: ["09:00", "19:00"],
    }),
    rule("closedDays", "정기 휴무 없이 매일 운영합니다.", { operator: "all" }),
  ];
  if (id === "demo-table")
    rules[1] = rule("weight", "반려견은 10kg 이하만 동반 가능합니다.", {
      operator: "lte",
      value: 10,
    });
  if (id === "demo-cafe")
    rules.push(
      rule("equipment", "이동장 또는 유모차를 이용해 주세요.", {
        operator: "any",
        items: ["이동장", "유모차"],
      }),
    );
  if (id === "demo-lake") rules.splice(2, 1);
  return {
    rules,
    unresolved: [],
    raw: rules.map((r) => r.quote).join("\n"),
    sourceLabel: "PawProof 자체 작성 가상 규정",
    sourceUrl: null,
    fetchedAt: new Date().toISOString(),
    modifiedAt: null,
  };
}
export function createDemoTrip(): TripInput {
  return createTrip(koreaToday(new Date()));
}
export function demoProviders(): Providers {
  const get = async (id: string) => {
    const place = demoPlaces.find((p) => p.id === id);
    if (!place) throw new Error("가상 장소를 찾을 수 없어요.");
    return { place, ...demoPolicy(id) };
  };
  return {
    places: {
      get,
      search: async (query, category) =>
        demoPlaces.filter(
          (p) =>
            p.name.includes(query) && (!category || p.category === category),
        ),
      nearby: async (place) =>
        demoPlaces.filter((p) => p.category === place.category),
    },
    extractor: { extract: async (document) => demoPolicy(document.place.id) },
    travel: {
      basis: "demo",
      minutes: async (a, b) =>
        Math.max(5, Math.round(Math.hypot(a.lat - b.lat, a.lng - b.lng) * 400)),
    },
  };
}
