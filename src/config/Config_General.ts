// ─── General config ──────────────────────────────────────────────────────────
// Cross-cutting settings used throughout the pipeline. Anything that's not
// feature-specific lives here.

// ── Debug ─────────────────────────────────────────────────────────────────
// DEBUG: prints high-level pipeline steps to the console, with truncated
// previews of large payloads (first 60 chars + length tail). Reads cleanly,
// good default for development.
// DEBUG_FULL: also prints FULL payloads — prompts, raw responses, translated
// text. Verbose; turn on when investigating a specific issue.
// The two flags are independent — DEBUG_FULL can fire without DEBUG.

export const DEBUG = true;
export const DEBUG_FULL = false;

// ── Breakdown ─────────────────────────────────────────────────────────────
// Character caps for breakdown-format AI replies. Used by AI_Run.

export type BreakdownLength = "short" | "medium" | "long";

export const BREAKDOWN_CHAR_LIMITS: Record<BreakdownLength, number> = {
  short: 800,
  medium: 1500,
  long: 2500,
};

export const DEFAULT_BREAKDOWN_LENGTH: BreakdownLength = "medium";
