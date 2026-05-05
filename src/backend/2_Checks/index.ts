import { translateToEnglish, TranslateResult } from "./Text/A_Check_Translate";
import { scanKeywords } from "./Text/B_Check_Keywords";
import { flagWithAI } from "./Text/C_Check_AIFlag";
import { debugLog } from "../_AI/AI_Debug";

/**
 * 2_Checks. Sub-pipeline that runs BEFORE the main AI scope. Photo
 * input goes through Image checks then becomes text and goes through
 * Text checks; pure text input goes straight into Text checks.
 *
 * Today only the text branch is live; the image branch is reserved
 * for future image-side checks (e.g. classification, gating).
 */

export type ChecksInput = {
  text?: string;
  // image?: { ocrText: string; vision?: string };  // reserved for image checks
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

  // Image checks would run here when input.image is set, then feed their
  // extracted text into the text-check stage below.

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

  debugLog("Check_Keywords", "Result", "Scanned", {
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
