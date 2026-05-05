/**
 * Friendly 12-hour formatter for schedule times. Stored format is
 * "HH:MM" (24-hour) so times still sort alphabetically; display
 * goes through this helper so users see "6:00pm" not "18:00".
 */
export function formatScheduleTime(time: string): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec((time || "").trim());
  if (!match) return time;
  let h = Number(match[1]);
  const m = match[2];
  const suffix = h >= 12 ? "pm" : "am";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m}${suffix}`;
}
