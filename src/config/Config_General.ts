/**
 * Cross-cutting settings used throughout the pipeline. Anything
 * that's not feature-specific lives here. Debug flags, breakdown
 * length caps, and the default length.
 */

/**
 * Debug flags.
 *   DEBUG       — high-level pipeline steps with truncated payload previews. Good default.
 *   DEBUG_FULL  — full payloads (prompts, raw responses). Verbose; turn on while debugging.
 * The two flags are independent: DEBUG_FULL can fire without DEBUG.
 */
export const DEBUG = true;
export const DEBUG_FULL = false;

// Length cap key used by AI_Run to clamp breakdown-format replies.
export type BreakdownLength = "short" | "medium" | "long";

// Character cap per length. Tunes how chatty the AI is allowed to get in breakdown mode.
export const BREAKDOWN_CHAR_LIMITS: Record<BreakdownLength, number> = {
  short: 800,
  medium: 1500,
  long: 2500,
};

// Default length when a chat config doesn't specify one.
export const DEFAULT_BREAKDOWN_LENGTH: BreakdownLength = "medium";
