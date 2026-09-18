import type { Finding } from "./types";

const fieldPrefix =
  /^\s*(?:[A-Za-z][A-Za-z0-9_]*|동반 가능 구역|동반 가능한 반려동물|방문객 준비사항|안전 안내|추가 동반 안내|동반 구역|현장에서 제공하는 시설|현장에서 제공하는 물품|이용 시간 안내|휴무 안내|반려견 동반 안내|예약 안내|문의 연락처)\s*:\s*/;
function cleanLine(line: string) {
  return line
    .replace(fieldPrefix, "")
    .replace(/^\s*-\s*/, "")
    .replace(/^\s*[•·]\s*/, "")
    .trim();
}
function normalizeLine(line: string) {
  return line
    .replace(/^맹견의\s*경우[,，]?\s*입마개\s*착용\s*필수[.!]?$/i, "맹견이라면 입마개를 착용해 주세요.")
    .replace(/^맹견은\s*입마개\s*착용\s*필수[.!]?$/i, "맹견이라면 입마개를 착용해 주세요.")
    .replace(/^배변봉투\s*지참\s*및\s*배변처리\s*필수[.!]?$/i, "배변봉투를 준비하고 배변을 처리해 주세요.")
    .replace(/^목줄\s*착용(?:\s*필수)?[.!]?$/i, "목줄을 착용해 주세요.")
    .replace(/^전구역\s*동반가능$/i, "반려견이 모든 구역에 동반할 수 있어요.")
    .replace(/^일부구역\s*동반가능$/i, "반려견은 일부 구역에서만 동반할 수 있어요.")
    .replace(/^전\s*견종\s*동반\s*가능$/i, "모든 견종이 동반할 수 있다고 안내되어 있어요.")
    .trim();
}
/** An explicit available entry rule can coexist with other conditions to confirm. */
export function hasKnownEntry(findings: Finding[]) {
  return findings.some(
    (finding) => finding.kind === "entry" && finding.status === "available",
  );
}
/** Convert provider field-prefixed evidence into copy users can understand. */
export function readableEvidence(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .split(/\r?\n/)
    .map(cleanLine)
    .map(normalizeLine)
    .filter(Boolean)
    .join("\n");
}
/** Remove source labels from findings before showing or sending them to users. */
export function readableMessage(value: string): string {
  return readableEvidence(value) || value.trim();
}
