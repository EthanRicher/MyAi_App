import { RunAIResult } from "../4_AI/AI_Types";

/**
 * Pulls a string out of a RunAI result, preferring `output` then `raw`, then
 * falling back to the caller-provided string. Same three-tier logic was
 * previously inlined in every chat wrapper.
 */
export function extractAIText(result: RunAIResult, fallback: string): string {
  if (typeof result.output === "string") return result.output;
  if (typeof result.raw === "string") return result.raw;
  return fallback;
}
