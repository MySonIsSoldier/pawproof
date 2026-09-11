import type { Place, Visit, VisitResult } from "../../domain/policies/types";
import { formatTime } from "../../domain/itinerary/time";
import { StatusBadge } from "../verification/status-badge";
import { Icon } from "../../components/icon";
export function VisitCard({
  place,
  visit,
  result,
  index,
  count,
  busy,
  stale,
  update,
  move,
  remove,
  evidence,
  recover,
}: {
  place: Place;
  visit: Visit;
  result?: VisitResult;
  index: number;
  count: number;
  busy: boolean;
  stale: boolean;
  update: (visit: Visit) => void;
  move: (offset: number) => void;
  remove: () => void;
  evidence: () => void;
  recover: () => void;
}) {
  const problem = result?.findings.find((f) => f.status === result.status);
  return (
    <article
      className={`visit-card ${result && !stale ? result.status : ""}`}
      id={`visit-${index}`}
      aria-label={`${index + 1}번 방문지 ${place.name}`}
    >
      <div className="visit-heading">
        <span className="visit-number">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="visit-name">
          <span className="place-category">
            <Icon
              name={
                place.category === "관광지"
                  ? "tree"
                  : place.category === "카페"
                    ? "cup"
                    : "fork"
              }
              size={13}
            />
            {place.category}
          </span>
          <h3>{place.name}</h3>
        </div>
        <div className="visit-actions">
          <button
            type="button"
            className="icon-button"
            aria-label={`${place.name} 위로`}
            disabled={busy || index === 0 || visit.locked}
            onClick={() => move(-1)}
          >
            <Icon name="up" size={16} />
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label={`${place.name} 아래로`}
            disabled={busy || index === count - 1 || visit.locked}
            onClick={() => move(1)}
          >
            <Icon name="down" size={16} />
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label={`${place.name} 삭제`}
            disabled={busy || visit.locked}
            onClick={remove}
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      </div>
      <p className="place-address">{place.address}</p>
      <div className="visit-fields">
        <label>
          <span>머무는 시간</span>
          <select
            aria-label={`${place.name} 체류시간`}
            value={visit.duration}
            disabled={busy}
            onChange={(e) =>
              update({ ...visit, duration: Number(e.target.value) })
            }
          >
            {[15, 30, 45, 60, 90, 120, 180, 240].map((n) => (
              <option value={n} key={n}>
                {n}분
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>이용 구역</span>
          <select
            aria-label={`${place.name} 이용 구역`}
            disabled={busy}
            value={visit.zone}
            onChange={(e) =>
              update({ ...visit, zone: e.target.value as Visit["zone"] })
            }
          >
            <option value="indoor">실내</option>
            <option value="outdoor">실외</option>
          </select>
        </label>
        <label className="lock-check">
          <input
            type="checkbox"
            checked={visit.locked}
            disabled={busy}
            onChange={(e) => update({ ...visit, locked: e.target.checked })}
          />
          <Icon name="lock" size={14} />꼭 유지
        </label>
      </div>
      {result && (
        <div className={`visit-verdict ${stale ? "stale" : ""}`}>
          <div className="verdict-top">
            <StatusBadge status={result.status} />
            <span>
              <Icon name="clock" size={13} />
              {formatTime(result.arrival)}–{formatTime(result.departure)}
            </span>
          </div>
          <p>
            {stale
              ? "이전 입력 기준이에요. 다시 검사하면 결과가 갱신돼요."
              : problem?.message || "확인된 동반 조건을 충족했어요."}
          </p>
          <div className="verdict-actions">
            <button
              type="button"
              className="text-button"
              onClick={evidence}
              disabled={stale}
            >
              근거 보기 <Icon name="arrow" size={14} />
            </button>
            {result.status !== "available" && (
              <button
                type="button"
                className="text-button"
                onClick={recover}
                disabled={busy || stale || visit.locked}
              >
                대체 장소 찾기 <Icon name="swap" size={15} />
              </button>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
