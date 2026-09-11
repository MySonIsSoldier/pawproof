import { statusLabels, type Status } from "../../domain/policies/types";
import { Icon } from "../../components/icon";
const icons = {
  available: "check",
  prepare: "bag",
  confirm: "info",
  blocked: "close",
} as const;
export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`status-badge ${status}`}>
      <Icon name={icons[status]} size={14} />
      {statusLabels[status]}
    </span>
  );
}
