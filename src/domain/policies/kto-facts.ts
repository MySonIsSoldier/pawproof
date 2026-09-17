import type { Policy, Rule } from "./types.ts";

const fieldLabels = new Set([
  "동반 가능 구역",
  "동반 가능한 반려동물",
  "방문객 준비사항",
  "안전 안내",
  "추가 동반 안내",
  "동반 구역",
  "현장에서 제공하는 시설",
  "현장에서 제공하는 물품",
  "이용 시간 안내",
  "휴무 안내",
  "반려견 동반 안내",
  "예약 안내",
  "문의 연락처",
]);

type Block = { label: string; text: string; quote: string };

function blocks(raw: string): Block[] {
  const lines = raw.split(/\r?\n/);
  const result: Block[] = [];
  let current: { label: string; lines: string[] } | null = null;
  const flush = () => {
    if (!current) return;
    const text = current.lines.join("\n").trim();
    if (text) {
      result.push({
        label: current.label,
        text,
        quote: `${current.label}: ${text}`,
      });
    }
    current = null;
  };
  for (const line of lines) {
    const match = line.match(/^([^:]+):\s*(.*)$/);
    if (match && fieldLabels.has(match[1])) {
      flush();
      current = { label: match[1], lines: [match[2]] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  flush();
  return result;
}

const equipmentNames = [
  ["목줄", "목줄"],
  ["이동장", "이동장"],
  ["켄넬", "이동장"],
  ["이동가방", "이동장"],
  ["유모차", "유모차"],
  ["입마개", "입마개"],
  ["예약", "예약"],
  ["추가요금", "추가요금"],
] as const;

function addRule(rules: Rule[], next: Rule) {
  const exists = rules.some(
    (rule) =>
      rule.kind === next.kind &&
      rule.scope === next.scope &&
      rule.operator === next.operator &&
      rule.value === next.value &&
      JSON.stringify(rule.items) === JSON.stringify(next.items) &&
      rule.quote === next.quote,
  );
  if (!exists) rules.push(next);
}

/**
 * KTO's pet-tour fields are structured facts. Keep them deterministic even
 * when the optional LLM extraction is unavailable or phrases are ambiguous.
 */
export function addKtoFacts(policy: Policy): Policy {
  const rules = [...policy.rules];
  const unresolved = new Set(policy.unresolved);
  for (const block of blocks(policy.raw)) {
    const compact = block.text.replace(/\s/g, "");
    if (block.label === "동반 가능 구역") {
      if (/전구역동반가능/.test(compact)) {
        addRule(rules, {
          kind: "entry",
          scope: "all",
          operator: "allow",
          value: null,
          items: [],
          quote: block.quote,
        });
      } else if (/일부구역동반가능/.test(compact)) {
        addRule(rules, {
          kind: "entry",
          scope: "all",
          operator: "allow",
          value: null,
          items: [],
          quote: block.quote,
        });
        unresolved.add(
          "반려견 동반이 가능한 구역이 일부로 안내되어 있어요. 실내·야외 중 어느 공간인지 방문 전에 확인해 주세요.",
        );
      }
    }
    if (block.label === "동반 가능한 반려동물" && /전견종동반가능/.test(compact)) {
      addRule(rules, {
        kind: "breed",
        scope: "all",
        operator: "allow",
        value: null,
        items: [],
        quote: block.quote,
      });
    }
    if (block.label === "방문객 준비사항") {
      const items = equipmentNames
        .filter(([needle]) => block.text.includes(needle))
        .map(([, item]) => item);
      if (items.length) {
        addRule(rules, {
          kind: "equipment",
          scope: "all",
          operator: "all",
          value: null,
          items: [...new Set(items)],
          quote: block.quote,
        });
      }
    }
    if (block.label === "추가 동반 안내") {
      const lines = block.text.split(/\r?\n/).map((line) => line.replace(/^\s*[-•·]\s*/, "").trim());
      const waste = lines.filter((line) => /배변봉투.*지참|배변.*처리/.test(line));
      if (waste.length) {
        addRule(rules, {
          kind: "equipment",
          scope: "all",
          operator: "all",
          value: null,
          items: ["배변봉투"],
          quote: block.quote,
        });
      }
      for (const line of lines) {
        if (/맹견.*입마개/.test(line))
          unresolved.add("맹견이라면 입마개를 착용해 주세요.");
        if (/개별\s*문의/.test(line))
          unresolved.add("장소 안의 매장별 정책이 달라 방문할 매장에 따로 문의해 주세요.");
        if (/가옥.*안쪽.*동반\s*불가|실내.*동반\s*불가/.test(line)) {
          addRule(rules, {
            kind: "entry",
            scope: "indoor",
            operator: "deny",
            value: null,
            items: [],
            quote: block.quote,
          });
        }
        if (/이동장|이동가방.*실내/.test(line)) {
          addRule(rules, {
            kind: "equipment",
            scope: "indoor",
            operator: "all",
            value: null,
            items: ["이동장"],
            quote: block.quote,
          });
        }
        if (/목줄.*1m|목줄.*길이/.test(line))
          unresolved.add("야외에서는 목줄 길이 제한이 안내되어 있어 방문 전에 확인해 주세요.");
      }
    }
  }
  return { ...policy, rules, unresolved: [...unresolved] };
}
