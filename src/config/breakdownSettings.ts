// ─── Breakdown Length Settings ────────────────────────────────────────────────
// Controls how long breakdown-style AI responses can be.
// Per-chat override lives on ChatConfig.breakdownLength in chatConfigs.ts.
// If a chat doesn't set one, DEFAULT_BREAKDOWN_LENGTH applies.

export type BreakdownLength = "concise" | "middle" | "alot";

export const BREAKDOWN_CHAR_LIMITS: Record<BreakdownLength, number> = {
  concise: 300,
  middle: 650,
  alot: 1400,
};

export const DEFAULT_BREAKDOWN_LENGTH: BreakdownLength = "concise";
