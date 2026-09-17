"use client";
import { useRef, useState } from "react";
import { Disclosure } from "../../components/ui/accordion";
import type { VisitResult } from "../../domain/policies/types";
import { StatusBadge } from "./status-badge";
import { Button } from "../../components/ui/button";
import { Icon } from "../../components/icon";
import { PolicySources } from "./policy-sources";
import { readableEvidence } from "../../domain/policies/presentation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "../../components/ui/dialog";
export function EvidenceDialog({
  result,
  historical = false,
  onClose,
}: {
  result: VisitResult;
  historical?: boolean;
  onClose: () => void;
}) {
  const returnFocus = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(true);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="evidence-dialog"
        onOpenAutoFocus={() => {
          returnFocus.current =
            document.activeElement instanceof HTMLElement
              ? document.activeElement
              : null;
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          returnFocus.current?.focus();
          // Radix keeps the content mounted until its exit animation finishes.
          if (!open) onClose();
        }}
      >
        {historical && (
          <p className="stale-notice">
            저장 당시의 판정 이유예요. 규정 원문은 저장하지 않으며, 최신 근거는
            코스를 다시 검사하면 확인할 수 있어요.
          </p>
        )}
        <div className="dialog-header">
          <div>
            <p className="eyebrow">WHY THIS RESULT?</p>
            <DialogTitle>{result.place.name} · 근거와 조건</DialogTitle>
          </div>
          <DialogClose asChild>
            <Button variant="icon" type="button" aria-label="근거 닫기">
              <Icon name="close" />
            </Button>
          </DialogClose>
        </div>
        <StatusBadge status={result.status} />
        <DialogDescription className="field-caption">
          {result.visit.zone === "indoor" ? "실내" : "실외"} 이용 기준 · 명시된
          조건과 입력한 준비 상태를 대조했어요.
        </DialogDescription>
        <div className="finding-list">
          {result.findings.map((finding, index) => (
            <section key={index} className={`finding ${finding.status}`}>
              <StatusBadge status={finding.status} />
              <p>{finding.message}</p>
              {finding.quote ? (
                <>
                  <blockquote>{readableEvidence(finding.quote)}</blockquote>
                  {result.policy.sources
                    ?.filter((source) => source.raw.includes(finding.quote!))
                    .map((source) => (
                      <p className="field-caption" key={source.label}>
                        {source.label}
                      </p>
                    ))}
                </>
              ) : (
                <span className="field-caption">
                  이 항목을 확정할 원문 근거가 없어요.
                </span>
              )}
            </section>
          ))}
        </div>
        <Disclosure className="raw-source" title="조회한 원문 전체">
          <pre>
            {readableEvidence(result.policy.raw) || "원문을 불러오지 못했어요."}
          </pre>
        </Disclosure>
        <PolicySources policy={result.policy} />
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
              <a
                href={result.policy.sourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                데이터 제공처 <span aria-hidden="true">↗</span>
              </a>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
