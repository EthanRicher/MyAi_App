import { RunAIResult } from "../_AI/AI_Types";
import { debugLog } from "../_AI/AI_Debug";

/**
 * Pulls a string out of a RunAI result, preferring `output` then `raw`, then
 * falling back to the caller-provided string. Same three-tier logic was
 * previously inlined in every chat wrapper.
 */
export function extractAIText(result: RunAIResult, fallback: string): string {
  const out =
    typeof result.output === "string"
      ? result.output
      : typeof result.raw === "string"
      ? result.raw
      : fallback;
  debugLog("Output_ExtractText", "Result", "Extracted", { chars: out.length });
  return out;
}
