// 2_Checks — sub-pipeline that runs *before* the main AI scope.
// Photo input → Image checks → text → Text checks → ready for scope.
// Pure text input → straight into Text checks.
//
// Today only the text branch is live; the image branch is reserved for
// future image-side checks (e.g. classification, gating).

import { translateToEnglish, TranslateResult } from "./Text/A_Check_Translate";
import { scanKeywords } from "./Text/B_Check_Keywords";
import { flagWithAI } from "./Text/C_Check_AIFlag";

export type ChecksInput = {
  text?: string;
  // image?: { ocrText: string; vision?: string };  // reserved for image checks
};

export type ChecksResult = {
  translation: TranslateResult;  // raw translate result so callers can show the original
  flaggedWords: string[];        // hardcoded keyword matches, deduped across original + translated
  flaggedReason?: string;        // AI second-pass reason when the message looks concerning
};

const collectFlagWords = (text: string): string[] =>
  scanKeywords(text)
    .filter((s) => s.kind === "flag")
    .map((s) => s.text);

export async function runChecks(input: ChecksInput): Promise<ChecksResult> {
  const sourceText = (input.text ?? "").trim();

  // Image checks would run here when input.image is set, then feed their
  // extracted text into the text-check stage below.

  // Translate and AI flag run in parallel — both are network calls, no
  // dependency between them, so we don't pay for them sequentially.
  const [translation, aiFlag] = await Promise.all([
    translateToEnglish(sourceText),
    flagWithAI(sourceText),
  ]);

  const resolvedText =
    translation.needed && translation.translated ? translation.translated : sourceText;

  // Scan both the original and the translated text so a translate failure
  // can't swallow a flag, and a phrase only urgent in the source language
  // (or only urgent once translated) still surfaces.
  const flaggedWords = Array.from(
    new Set([...collectFlagWords(sourceText), ...collectFlagWords(resolvedText)])
  );

  return {
    translation,
    flaggedWords,
    flaggedReason: aiFlag.concerning ? aiFlag.reason : undefined,
  };
}

export type { TranslateResult };
