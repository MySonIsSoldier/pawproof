import type { Place, Policy, TripInput, Zone, Finding } from "./types.ts";
import { evaluatePolicy, summarize } from "./evaluate.ts";

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
        f.message = "반려견 체중을 입력해 주세요.";
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
    .map((f) => f.message);
  return `${place.name} (${place.address}) 문의드립니다.\n${trip.date}에 반려견 ${trip.pets.length}마리(${pets})와 ${zone === "indoor" ? "실내" : "야외/테라스"}를 이용하려고 합니다.\n${questions.length ? questions.map((q) => `- ${q}`).join("\n") : "방문일 동반 이용 조건이 동일한지 확인 부탁드립니다."}\n위 조건의 이용 가능 여부와 필요한 준비사항을 알려주세요.`;
}
