import { translateToEnglish, TranslateResult } from "./Text/A_Check_Translate";
import { scanKeywords } from "./Text/B_Check_Keywords";
import { flagWithAI } from "./Text/C_Check_AIFlag";
import { debugLog } from "../_AI/AI_Debug";

/**
 * 2_Checks. Sub-pipeline that runs BEFORE the main AI scope. Text
 * input flows through translate + keyword scan + AI second-pass flag,
 * in parallel where possible.
 */

export type ChecksInput = {
  text?: string;
};

export type ChecksResult = {
  translation: TranslateResult; // Raw translate result so callers can show the original.
  flaggedWords: string[];       // Hardcoded keyword matches, deduped across original + translated.
  flaggedReason?: string;       // AI second-pass reason when the message looks concerning.
};

// Pull just the matched red-flag words out of a keyword scan.
const collectFlagWords = (text: string): string[] =>
  scanKeywords(text)
    .filter((s) => s.kind === "flag")
    .map((s) => s.text);

export async function runChecks(input: ChecksInput): Promise<ChecksResult> {
  const sourceText = (input.text ?? "").trim();

  /**
   * Translate and AI flag run in parallel. Both are network calls
   * with no dependency between them, so we don't pay for them
   * sequentially.
   */
  const [translation, aiFlag] = await Promise.all([
    translateToEnglish(sourceText),
    flagWithAI(sourceText),
  ]);

  const resolvedText =
    translation.needed && translation.translated ? translation.translated : sourceText;

  /**
   * Scan both the original and the translated text so a translate
   * failure can't swallow a flag, and a phrase only urgent in the
   * source language (or only urgent once translated) still surfaces.
   */
  const flaggedWords = Array.from(
    new Set([...collectFlagWords(sourceText), ...collectFlagWords(resolvedText)])
  );

  debugLog("Checks", "Result", "Keywords scanned", {
    matches: flaggedWords.length,
    words: flaggedWords,
  });

  return {
    translation,
    flaggedWords,
    flaggedReason: aiFlag.concerning ? aiFlag.reason : undefined,
  };
}

export type { TranslateResult };
