import type { Place, Policy, TripInput, Zone, Finding } from "./types.ts";
import { evaluatePolicy, summarize } from "./evaluate.ts";
import { readableMessage } from "./presentation.ts";

export function assessDiscovery(
  policy: Policy | undefined,
  trip: TripInput,
  zone: Zone,
) {
  if (!policy)
    return {
      status: "confirm" as const,
      findings: [
        {
          kind: "source",
          status: "confirm",
          message: "동반 조건을 아직 확인하지 않았어요.",
          quote: null,
          needs: [],
        },
      ] satisfies Finding[],
    };
  const findings = evaluatePolicy(policy, {
    pets: trip.pets.map((p, i) => ({
      ...p,
      name: p.name || `반려견 ${i + 1}`,
      breed: p.breed.trim() || "미상",
    })),
    equipment: trip.equipment,
    date: trip.date,
    zone,
    arrival: null,
    duration: 60,
  }).filter((f) => f.kind !== "hours" && f.kind !== "closedDays");
  if (trip.pets.some((p) => !Number.isFinite(p.weight) || p.weight <= 0)) {
    for (const f of findings)
      if (f.kind === "weight") {
        f.status = "confirm";
        f.message = "반려견 체중 제한 정보가 없어 확인이 필요해요.";
      }
  }
  return { status: summarize(findings), findings };
}
export function inquiryText(
  place: Place,
  trip: TripInput,
  zone: Zone,
  findings: Finding[],
) {
  const pets = trip.pets
    .map(
      (p) =>
        `${p.breed || "견종 미입력"} ${p.weight > 0 ? `${p.weight}kg` : "체중 미입력"}`,
    )
    .join(", ");
  const questions = findings
    .filter((f) => f.status !== "available")
    .map((f) => readableMessage(f.message));
  return `안녕하세요. 방문 가능 여부를 문의드려요.\n\n${trip.date}에 ${place.name}에 ${zone === "indoor" ? "실내" : "야외/테라스"}로 반려견 ${trip.pets.length}마리(${pets})와 방문하려고 합니다.\n방문 전에 아래 내용을 확인 부탁드립니다.\n${questions.length ? questions.map((q) => `- ${q}`).join("\n") : "- 반려견 동반 가능 여부와 필요한 준비사항"}\n\n가능 여부와 준비할 사항을 알려주시면 감사하겠습니다.`;
}
