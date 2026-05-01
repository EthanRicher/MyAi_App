import { DEBUG, DEBUG_FULL } from "../../config/Config_General";

// Single-row separator marking the start of a user-initiated pipeline turn.
export function debugTurn(): void {
  if (!DEBUG && !DEBUG_FULL) return;
  console.log("─── Turn ───");
}

// End-of-turn marker. No-op for now — kept so call sites (ChatScreen,
// Input_Camera, Input_SpeechHook) have a stable hook for future additions
// like total-turn timing without having to re-thread imports everywhere.
export function debugTurnEnd(): void {}

// Short, single-line pipeline event. Prints when DEBUG is on.
export function debugLog(
  module: string,
  eventType: string,
  message: string,
  fields?: Record<string, any>
): void {
  if (!DEBUG) return;
  const fieldStr = fields && Object.keys(fields).length > 0
    ? " - " + Object.entries(fields)
        .map(([k, v]) => `${k}: ${formatField(v)}`)
        .join(" - ")
    : "";
  console.log(`${module}_${eventType}: ${message}${fieldStr}`);
}

// Payload logger. Both DEBUG modes print on a SINGLE line so the console
// stays scannable — newlines inside the value are escaped as `\n`.
//   DEBUG only:   60-char truncated preview + length tail.
//   DEBUG_FULL:   full value flattened onto one line.
export function debugPayload(module: string, key: string, value: any): void {
  if (!DEBUG && !DEBUG_FULL) return;
  const text = typeof value === "string" ? value : JSON.stringify(value, null, 2);
  const flat = text.replace(/\n/g, "\\n");

  if (DEBUG_FULL) {
    console.log(`${module}_${key}: "${flat}"`);
    return;
  }

  const PREVIEW = 60;
  if (flat.length <= PREVIEW) {
    console.log(`${module}_${key}: "${flat}"`);
  } else {
    console.log(`${module}_${key}: "${flat.slice(0, PREVIEW)}..." [${PREVIEW}/${flat.length} chars]`);
  }
}

// Compact time format for pipeline timing fields.
export const formatTime = (ms: number): string =>
  ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;

// Computed values like times ("1.2s", "300ms") print bare; user-supplied
// strings stay quoted so their boundaries are visible.
const DURATION_RE = /^\d+(\.\d+)?(ms|s)$/;

function formatField(v: any): string {
  if (v === null || v === undefined) return String(v);
  if (typeof v === "string") {
    if (DURATION_RE.test(v)) return v;
    if (v.length <= 80) return `"${v}"`;
    return `"${v.slice(0, 60)}..." [${v.length} chars]`;
  }
  if (Array.isArray(v)) {
    if (v.length === 0) return "[]";
    if (v.every((x) => typeof x === "string")) return `[${v.map((x) => `"${x}"`).join(", ")}]`;
    return `[${v.length} items]`;
  }
  if (typeof v === "object") return "{...}";
  return String(v);
}
