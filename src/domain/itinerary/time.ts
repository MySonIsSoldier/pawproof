export function toMinutes(time: string): number {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}
export function formatTime(minutes: number | null): string {
  if (minutes === null) return "시간 미확정";
  const nextDay = minutes >= 1440 ? "다음 날 " : "";
  return `${nextDay}${String(Math.floor(minutes / 60) % 24).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}
/** A date-only Korean travel day has the same weekday without server-local conversion. */
export function weekday(date: string): number { return new Date(`${date}T12:00:00+09:00`).getUTCDay(); }
export function koreaToday(now = new Date()): string {
  return new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
