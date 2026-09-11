import type { Place, Visit, VisitResult } from "../../domain/policies/types";
import { formatTime } from "../../domain/itinerary/time";
import { StatusBadge } from "../verification/status-badge";
import { Button } from "../../components/ui/button";
import { Icon } from "../../components/icon";
import { Checkbox } from "../../components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
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
          <Button
            variant="icon"
            type="button"
            aria-label={`${place.name} 위로`}
            disabled={busy || index === 0 || visit.locked}
            onClick={() => move(-1)}
          >
            <Icon name="up" size={16} />
          </Button>
          <Button
            variant="icon"
            type="button"
            aria-label={`${place.name} 아래로`}
            disabled={busy || index === count - 1 || visit.locked}
            onClick={() => move(1)}
          >
            <Icon name="down" size={16} />
          </Button>
          <Button
            variant="icon"
            type="button"
            aria-label={`${place.name} 삭제`}
            disabled={busy || visit.locked}
            onClick={remove}
          >
            <Icon name="close" size={16} />
          </Button>
        </div>
      </div>
      <p className="place-address">{place.address}</p>
      <div className="visit-fields">
        <div className="ui-field">
          <span>머무는 시간</span>
          <Select
            value={String(visit.duration)}
            disabled={busy}
            onValueChange={(value) =>
              update({ ...visit, duration: Number(value) })
            }
          >
            <SelectTrigger aria-label={`${place.name} 체류시간`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[...new Set([15, 30, 45, 60, 90, 120, 180, 240, visit.duration])]
                .sort((a, b) => a - b)
                .map((n) => (
                  <SelectItem value={String(n)} key={n}>
                    {n}분
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <div className="ui-field">
          <span>이용 구역</span>
          <Select
            disabled={busy}
            value={visit.zone}
            onValueChange={(value) =>
              update({ ...visit, zone: value as Visit["zone"] })
            }
          >
            <SelectTrigger aria-label={`${place.name} 이용 구역`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="indoor">실내</SelectItem>
              <SelectItem value="outdoor">실외</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <label className="lock-check">
          <Checkbox
            aria-label="꼭 유지"
            checked={visit.locked}
            disabled={busy}
            onCheckedChange={(checked) =>
              update({ ...visit, locked: checked === true })
            }
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
            <Button
              variant="link"
              type="button"
              onClick={evidence}
              disabled={stale}
            >
              근거 보기 <Icon name="arrow" size={14} />
            </Button>
            {result.status !== "available" && (
              <Button
                variant="link"
                type="button"
                onClick={recover}
                disabled={busy || stale || visit.locked}
              >
                대체 장소 찾기 <Icon name="swap" size={15} />
              </Button>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
