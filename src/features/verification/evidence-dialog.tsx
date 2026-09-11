"use client";
import { useEffect, useRef } from "react";
import type { VisitResult } from "../../domain/policies/types";
import { StatusBadge } from "./status-badge";
import { Icon } from "../../components/icon";
export function EvidenceDialog({
  result,
  onClose,
}: {
  result: VisitResult;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = dialog.current;
    node?.showModal();
    return () => node?.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="evidence-dialog"
      aria-labelledby="evidence-title"
      onClose={() => {
        if (!dialog.current?.open) onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) dialog.current?.close();
      }}
    >
      <div className="dialog-header">
        <div>
          <p className="eyebrow">WHY THIS RESULT?</p>
          <h2 id="evidence-title">{result.place.name} · 근거와 조건</h2>
        </div>
        <button
          autoFocus
          type="button"
          className="icon-button"
          aria-label="근거 닫기"
          onClick={() => dialog.current?.close()}
        >
          <Icon name="close" />
        </button>
      </div>
      <StatusBadge status={result.status} />
      <p className="field-caption">
        {result.visit.zone === "indoor" ? "실내" : "실외"} 이용 기준 · 명시된
        조건과 입력한 준비 상태를 대조했어요.
      </p>
      <div className="finding-list">
        {result.findings.map((finding, index) => (
          <section key={index} className={`finding ${finding.status}`}>
            <StatusBadge status={finding.status} />
            <p>{finding.message}</p>
            {finding.quote ? (
              <blockquote>{finding.quote}</blockquote>
            ) : (
              <span className="field-caption">
                이 항목을 확정할 원문 근거가 없어요.
              </span>
            )}
          </section>
        ))}
      </div>
      <details className="raw-source">
        <summary>조회한 원문 전체</summary>
        <pre>{result.policy.raw || "원문을 불러오지 못했어요."}</pre>
      </details>
      <div className="source-meta">
        <strong>{result.policy.sourceLabel}</strong>
        <p>
          조회:{" "}
          {new Date(result.policy.fetchedAt).toLocaleString("ko-KR", {
            timeZone: "Asia/Seoul",
          })}
        </p>
        <p>콘텐츠 수정: {result.policy.modifiedAt || "제공되지 않음"}</p>
        <p>업체 규정 확인 일시: 별도 확인되지 않음</p>
        {result.policy.sourceUrl &&
          /^https:\/\/(api\.visitkorea\.or\.kr|korean\.visitkorea\.or\.kr)\//.test(
            result.policy.sourceUrl,
          ) && (
            <a href={result.policy.sourceUrl} target="_blank" rel="noreferrer">
              데이터 제공처 <span aria-hidden="true">↗</span>
            </a>
          )}
      </div>
    </dialog>
  );
}
