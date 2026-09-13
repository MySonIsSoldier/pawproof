import type { usePlanner } from "./hooks/use-planner";
import { statusLabels } from "../../domain/policies/types";
import { Button } from "../../components/ui/button";
import { Icon } from "../../components/icon";
type Props = Pick<
  ReturnType<typeof usePlanner>,
  | "historical"
  | "result"
  | "trip"
  | "stale"
  | "busy"
  | "notice"
  | "error"
  | "previous"
  | "verify"
  | "undo"
>;
export function VerificationPanel({
  result,
  historical,
  trip,
  stale,
  busy,
  notice,
  error,
  previous,
  verify,
  undo,
}: Props) {
  return (
    <section className="verification-panel">
      <div className="panel-title">
        <span className="round-icon">
          <Icon name="shield" />
        </span>
        <div>
          <h2>{result ? "코스 확인 결과" : "출발 전, 함께 확인해요"}</h2>
          <p>
            {result
              ? `${trip.visits.length}개 방문지 · ${stale ? "입력 변경됨" : "조건별 근거를 확인하세요"}`
              : "반려견 조건과 방문 시간을 살펴볼게요."}
          </p>
        </div>
      </div>
      <div className={`status-counts ${stale ? "stale" : ""}`}>
        {(["available", "prepare", "confirm", "blocked"] as const).map(
          (status) => (
            <div key={status} className={status}>
              <strong>
                {result
                  ? result.visits.filter((v) => v.status === status).length
                  : "—"}
              </strong>
              <span>{statusLabels[status]}</span>
            </div>
          ),
        )}
      </div>
      {historical && result && (
        <p className="stale-notice" role="status">
          저장 당시 검사 결과 ·{" "}
          {new Date(result.verifiedAt).toLocaleString("ko-KR", {
            timeZone: "Asia/Seoul",
          })}
          <br />
          현재 이용 가능 여부를 보장하지 않아요. 원문과 최신 조건은 다시 검사해
          주세요.
        </p>
      )}
      {stale && (
        <p role="status" className="stale-notice">
          입력이 변경되었어요. 다시 검사해 주세요.
        </p>
      )}
      <Button
        variant="primary"
        type="button"
        className="verify-button no-print"
        onClick={() => void verify()}
        disabled={!!busy}
        aria-busy={busy === "verify"}
      >
        <Icon name={busy ? "clock" : "shield"} />
        {busy === "verify"
          ? "동반 조건을 확인하고 있어요…"
          : busy === "recover"
            ? "대체 코스를 살펴보고 있어요…"
            : result
              ? "코스 다시 검사하기"
              : "이 코스 검사하기"}
        <Icon name="arrow" size={18} />
      </Button>
      <p className="field-caption">
        {trip.mode === "demo"
          ? "가상 체험에도 실제와 같은 판정 규칙을 적용해요."
          : "규정 조회와 분석에 시간이 걸릴 수 있어요. 결과는 원문과 함께 확인해 주세요."}
      </p>
      <div className="notice">{notice}</div>
      {error && (
        <p role="alert" className="inline-error">
          {error}
        </p>
      )}
      {previous && (
        <Button
          variant="link"
          type="button"
          className="no-print"
          onClick={undo}
          disabled={!!busy}
        >
          <Icon name="undo" size={16} /> 교체 전 코스로 되돌리기
        </Button>
      )}
    </section>
  );
}
