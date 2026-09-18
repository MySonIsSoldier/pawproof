import type { usePlanner } from "./hooks/use-planner";
import { Button } from "../../components/ui/button";
import { Icon } from "../../components/icon";
type Props = Pick<
  ReturnType<typeof usePlanner>,
  "alternatives" | "placeFor" | "trip" | "applyAlternative"
>;
export function AlternativesPanel({
  alternatives,
  placeFor,
  trip,
  applyAlternative,
}: Props) {
  if (!alternatives) return null;
  return (
    <section className="alternatives" aria-label="대체 장소 비교">
      <p className="eyebrow">A SMALL CHANGE, A BETTER DAY</p>
      <h2>이런 곳은 어떨까요?</h2>
      <p className="field-caption">
        {placeFor(trip.visits[alternatives.index].placeId).name} 대신 · 검토한
        후보 {alternatives.inspected}곳
      </p>
      {alternatives.items.length ? (
        alternatives.items.map((alternative) => (
          <article key={alternative.place.id}>
            <div>
              <span className="place-category">
                {alternative.place.category}
              </span>
              <h3>{alternative.place.name}</h3>
              <p>
                전체 이동 {alternative.extraMinutes >= 0 ? "+" : ""}
                {alternative.extraMinutes}분 · 이후 일정 재검증
              </p>
              <p className="field-caption">
                {alternative.result.visits[alternatives.index].status ===
                "available"
                  ? "확인된 동반 조건을 충족해요."
                  : alternative.result.visits[alternatives.index].status ===
                      "prepare"
                    ? "준비사항이 있어요. 적용 후 해당 규정을 확인해 주세요."
                    : "방문 전 확인할 조건이 있어요. 적용 후 근거를 살펴봐 주세요."}
              </p>
            </div>
            <Button
              variant="primary"
              size="small"
              type="button"
              onClick={() => applyAlternative(alternative, alternatives.index)}
            >
              이 장소로 교체 <Icon name="swap" size={15} />
            </Button>
          </article>
        ))
      ) : (
        <p>
          유효한 후보가 없어요. 고정 일정·이용 구역·시간을 살펴보거나 다른
          장소를 직접 찾아주세요.
        </p>
      )}
      <p className="field-caption">
        조회한 후보 중 비교한 결과예요. 모든 장소 중 최적의 코스를 보장하지
        않아요.
      </p>
    </section>
  );
}
