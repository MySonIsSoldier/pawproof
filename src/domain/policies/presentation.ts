const fieldPrefix =
  /^\s*(?:[A-Za-z][A-Za-z0-9_]*|동반 가능 구역|동반 가능한 반려동물|방문객 준비사항|안전 안내|추가 동반 안내|동반 구역|현장에서 제공하는 시설|현장에서 제공하는 물품|이용 시간 안내|휴무 안내|반려견 동반 안내|예약 안내|문의 연락처)\s*:\s*/;
function cleanLine(line: string) {
  return line.replace(fieldPrefix, "").replace(/^\s*-\s*/, "").trim();
}
/** Convert provider field-prefixed evidence into copy users can understand. */
export function readableEvidence(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .split(/\r?\n/)
    .map(cleanLine)
    .filter(Boolean)
    .join("\n");
}
/** Remove source labels from findings before showing or sending them to users. */
export function readableMessage(value: string): string {
  const message = readableEvidence(value) || value;
  return message
    .replace(
      /^맹견의 경우,\s*입마개 착용 필수$/,
      "맹견이라면 입마개를 착용해 주세요.",
    )
    .replace(/^일부구역 동반가능$/, "일부 구역에서만 반려견 동반이 가능해요.");
}
