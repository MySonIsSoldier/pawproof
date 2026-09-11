import type { TripInput, TripResult } from "../../domain/policies/types";
import { formatTime } from "../../domain/itinerary/time";
import { buildPreparation } from "../../domain/itinerary/preparation";
import { Icon } from "../../components/icon";
export function Preparation({
  trip,
  result,
  notify,
}: {
  trip: TripInput;
  result: TripResult;
  notify: (message: string) => void;
}) {
  const tasks = buildPreparation(result);
  const questions = result.visits.filter((v) =>
    v.findings.some((f) => f.status === "confirm"),
  );
  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      notify("문의 문구를 복사했어요.");
    } catch {
      notify(
        "복사가 지원되지 않아요. 표시된 문의 문구를 선택해 복사해 주세요.",
      );
    }
  }
  return (
    <section className="preparation">
      <p className="print-summary">
        {trip.date} ·{" "}
        {trip.pets
          .map((pet) => `${pet.name} (${pet.breed}, ${pet.weight}kg)`)
          .join(", ")}{" "}
        · 첫 장소 {trip.startTime}
      </p>
      <div className="section-heading">
        <div>
          <p className="eyebrow">READY, SET, TOGETHER</p>
          <h2>출발 전, 챙겨주세요.</h2>
        </div>
        <button
          className="text-button no-print"
          type="button"
          onClick={() => window.print()}
        >
          <Icon name="print" size={16} /> 준비표 인쇄
        </button>
      </div>
      {result.visits.some((v) => v.status === "blocked") && (
        <p className="inline-error">
          이용 불가 방문지가 남아 있어요. 여행을 확정하기 전에 코스를 수정해
          주세요.
        </p>
      )}
      <div className="prep-columns">
        <div className="prep-block">
          <h3>
            <Icon name="bag" /> 남은 준비사항 <span>{tasks.length}</span>
          </h3>
          {tasks.length ? (
            <ul>
              {tasks.map((task, i) => (
                <li key={i}>
                  <strong>{task.label}</strong>
                  {task.sources.map((source, index) => (
                    <p key={index}>
                      {source.place}
                      <br />
                      <small>근거: {source.quote}</small>
                    </p>
                  ))}
                </li>
              ))}
            </ul>
          ) : (
            <p className="field-caption">
              확인된 규정에서 추가 준비사항은 없어요. 미확인 규정은 별도로
              확인해 주세요.
            </p>
          )}
          <p className="field-caption">
            같은 준비물은 합쳐 표시했어요. 상단 준비 체크를 바꾼 뒤 다시
            검사하면 반영돼요.
          </p>
        </div>
        <div className="prep-block">
          <h3>
            <Icon name="info" /> 확인할 질문 <span>{questions.length}</span>
          </h3>
          {questions.map((v) => {
            const topics = [
              ...new Set(
                v.findings
                  .filter((f) => f.status === "confirm")
                  .map((f) => f.message),
              ),
            ];
            const text = `${trip.date} ${formatTime(v.arrival)}에 ${trip.pets.map((p) => `${p.breed} ${p.weight}kg`).join(", ")} 총 ${trip.pets.length}마리와 ${v.visit.zone === "indoor" ? "실내" : "실외"} 방문을 계획하고 있어요. 다음 내용을 확인 부탁드립니다.\n${topics.join("\n")}`;
            return (
              <details key={v.place.id}>
                <summary>{v.place.name}</summary>
                <p className="question-text">{text}</p>
                <button
                  type="button"
                  className="text-button no-print"
                  onClick={() => void copy(text)}
                >
                  문의 문구 복사 <Icon name="arrow" size={14} />
                </button>
              </details>
            );
          })}
          {!questions.length && (
            <p className="field-caption">
              현재 검사에서 남은 미확인 항목은 없어요. 현장 운영 변경 여부는
              방문 전 확인해 주세요.
            </p>
          )}
        </div>
      </div>
      <p className="verification-footnote">
        {result.mode === "demo"
          ? "가상 체험 결과 · 실제 여행에 사용하지 마세요."
          : "출처: ⓒ한국관광공사 · 이용 가능은 현장 입장이나 예약을 보장하지 않습니다."}{" "}
        검사 시각{" "}
        {new Date(result.verifiedAt).toLocaleString("ko-KR", {
          timeZone: "Asia/Seoul",
        })}
      </p>
    </section>
  );
}
