import { RunAIResult } from "../_AI/AI_Types";
import { debugLog } from "../_AI/AI_Debug";

/**
 * Pulls a string out of a RunAI result. Prefers `output` (the
 * scope's mapOutput result), then `raw` (the model's untouched
 * text), then the caller's fallback. The same three-tier logic
 * used to be inlined in every chat wrapper.
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
