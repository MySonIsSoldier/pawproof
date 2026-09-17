import type {
  TripInput,
  Place,
  Zone,
  Finding,
  Status,
} from "../../domain/policies/types";
import type { Inspection } from "../../application/contracts/discovery";
import { inquiryText } from "../../domain/policies/discovery";
import { kakaoPlaceSearch, telephoneLink } from "../../lib/urls/place-contact";
import { Button } from "../../components/ui/button";
import { Disclosure } from "../../components/ui/accordion";
import { useNotify } from "../../components/notifications/with-notifications";
export const mapStatusLabels: Record<Status, string> = {
  available: "조건 충족",
  prepare: "준비 필요",
  confirm: "확인 필요",
  blocked: "조건 불일치",
};
export function PlaceDetail({
  place,
  check,
  findings,
  status,
  trip,
  zone,
  inspecting,
  added,
  full,
  back,
  inspect,
  add,
}: {
  place: Place;
  check?: Inspection;
  findings: Finding[];
  status: Status;
  trip: TripInput;
  zone: Zone;
  inspecting: boolean;
  added: boolean;
  full: boolean;
  back: () => void;
  inspect: () => void;
  add: () => void;
}) {
  const notify = useNotify();
  const telephone = telephoneLink(check?.phone ?? null);
  const confirmed = findings.filter((f) => f.status === "available");
  const remaining = findings.filter((f) => f.status !== "available");
  const vaccination = remaining.find((f) => f.kind === "vaccination");
  const otherRemaining = remaining.filter((f) => f.kind !== "vaccination");
  const inquiry = inquiryText(place, trip, zone, findings);
  async function copy() {
    try {
      await navigator.clipboard.writeText(inquiry);
      notify({ kind: "success", title: "문의 문구를 복사했어요" });
    } catch {
      notify({ kind: "error", title: "아래 문의 문구를 선택해 복사해 주세요" });
    }
  }
  return (
    <article className="explore-detail" aria-label={`${place.name} 상세`}>
      <Button variant="link" onClick={back}>
        ← 장소 목록
      </Button>
      <p className={`map-status ${status}`}>{mapStatusLabels[status]}</p>
      <h2>{place.name}</h2>
      <p className="field-caption">
        {place.category} · {place.address}
      </p>
      <div className="detail-actions">
        <Button variant="primary" disabled={added || full} onClick={add}>
          {added
            ? "코스에 담았어요"
            : full
              ? "코스는 최대 5곳이에요"
              : "코스에 담기"}
        </Button>
        <Button variant="outline" disabled={inspecting} onClick={inspect}>
          {inspecting
            ? "조건 확인 중…"
            : check
              ? "조건 다시 확인"
              : "이곳 조건 확인"}
        </Button>
      </div>
      <p className="field-caption">
        {zone === "indoor" ? "실내" : "야외/테라스"} 동반 조건 기준이에요.
        영업시간과 이동 일정은 여행 노트에서 검사해 주세요.
      </p>
      {!!confirmed.length && (
        <div className="condition-known">
          <h3>여기까지 확인했어요</h3>
          <ul>
            {confirmed.map((f, i) => (
              <li key={i}>{f.message}</li>
            ))}
          </ul>
        </div>
      )}
      {vaccination && (
        <div className="vaccination-notice">
          <h3>예방접종 제한을 확인해 주세요</h3>
          <p>{vaccination.message}</p>
        </div>
      )}
      {!!otherRemaining.length && (
        <div className="condition-missing">
          <h3>
            {status === "blocked"
              ? "맞지 않거나 확인할 조건"
              : "방문 전 확인할 부분"}
          </h3>
          <ul>
            {otherRemaining.map((f, i) => (
              <li key={i}>{f.message}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="contact-actions">
        {telephone ? (
          <a className="button outline" href={telephone}>
            전화하기 · {check?.phone}
          </a>
        ) : (
          <p className="field-caption">
            {check?.phone
              ? `안내 연락처: ${check.phone} · 번호를 확인해 주세요.`
              : "확인된 전화번호가 없어요. 카카오맵에서 같은 지점을 찾아주세요."}
          </p>
        )}
        <a
          className="button outline"
          href={kakaoPlaceSearch(place)}
          target="_blank"
          rel="noreferrer"
        >
          카카오맵에서 상호·주소 검색 ↗
        </a>
      </div>
      <Disclosure title="이렇게 문의해 보세요">
        <p className="inquiry-copy">{inquiry}</p>
        <Button variant="outline" onClick={() => void copy()}>
          문의 문구 복사
        </Button>
      </Disclosure>
      {check && (
        <Disclosure title="규정 근거와 조회 시각">
          <p className="field-caption">
            조회:{" "}
            {new Date(check.policy.fetchedAt).toLocaleString("ko-KR", {
              timeZone: "Asia/Seoul",
            })}{" "}
            · 업체가 규정을 확인한 시각과 다를 수 있어요.
          </p>
          <p>{check.policy.sourceLabel}</p>
          {findings
            .filter((f) => f.quote)
            .map((f, i) => (
              <blockquote key={i}>{f.quote}</blockquote>
            ))}
          {check.policy.sourceUrl &&
            /^https?:\/\//.test(check.policy.sourceUrl) && (
              <a href={check.policy.sourceUrl} target="_blank" rel="noreferrer">
                출처 보기 ↗
              </a>
            )}
        </Disclosure>
      )}
    </article>
  );
}
