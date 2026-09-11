export function pwaEnabled(
  value: string | undefined,
  development: boolean,
): boolean {
  if (value === undefined || value === "") return !development;
  if (value !== "true" && value !== "false")
    throw new Error("PWA_ENABLED must be true or false.");
  return value === "true";
}
