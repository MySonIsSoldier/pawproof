import { statusLabels, type Finding, type Status } from "../../domain/policies/types";
import { Icon } from "../../components/icon";
import {
  hasBlockedEntry,
  hasKnownEntry,
} from "../../domain/policies/presentation";
const icons = {
  available: "check",
  prepare: "bag",
  confirm: "info",
  blocked: "close",
} as const;
export function StatusBadge({
  status,
  label,
}: {
  status: Status;
  label?: string;
}) {
  return (
    <span className={`status-badge ${status}`}>
      <Icon name={icons[status]} size={14} />
      {label || statusLabels[status]}
    </span>
  );
}

export function ResultStatusBadges({
  status,
  findings,
}: {
  status: Status;
  findings: Finding[];
}) {
  const entryKnown = hasKnownEntry(findings);
  const entryBlocked = hasBlockedEntry(findings);
  return (
    <span className="result-status-badges">
      {entryKnown && (
        <span className="status-badge available">
          {entryBlocked ? "일부 구역 이용 가능" : "반려견 출입 가능"}
        </span>
      )}
      {(!entryKnown || status !== "available") && (
        <StatusBadge
          status={status}
          label={entryBlocked && status === "blocked" ? "선택 구역 이용 불가" : undefined}
        />
      )}
    </span>
  );
}
