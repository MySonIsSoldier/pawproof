/** Convert provider field-prefixed evidence into copy users can understand. */
export function readableEvidence(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .split(/\r?\n/)
    .map((line) =>
      line
        .replace(/^\s*[A-Za-z][A-Za-z0-9_]*\s*:\s*/, "")
        .replace(/^\s*-\s*/, "")
        .trim(),
    )
    .filter(Boolean)
    .join("\n");
}
