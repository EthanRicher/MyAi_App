import { AIScope, RunAIResult } from "../../_AI/AI_Types";
import { runAI } from "../../_AI/AI_Run";
import { runVision } from "./Input_Vision";
import { runOCR } from "./Input_OCR";
import { PhotoMode } from "./Input_Camera";

/**
 * Runs a photo through the right reader (Vision or OCR) and then
 * feeds the resulting text into a normal AI scope. Used by features
 * like MedView's prescription scan, which want a one-call helper
 * that goes from photo to structured AI output.
 */

export async function runAIOnPhoto(
  imageUri: string,
  scope: AIScope,
  mode: PhotoMode = PhotoMode.VisionWithFallback
): Promise<RunAIResult & { analysis: string }> {
  let analysis = "";

  // Pick the reader. Same fallback behaviour as Input_Camera.
  if (mode === PhotoMode.OCR) {
    analysis = await runOCR(imageUri) || "";
  } else if (mode === PhotoMode.Vision) {
    analysis = await runVision(imageUri);
  } else {
    analysis = await runVision(imageUri);
    if (!analysis) {
      analysis = await runOCR(imageUri) || "";
    }
  }

  // Bail early when the photo couldn't be read at all.
  if (!analysis) {
    return {
      analysis: "",
      error: "The photo could not be read. Please try again with a clearer image.",
    };
  }

  // Use the scope's photo prompt builder if it has one, otherwise reuse the normal text prompt.
  const promptFn = scope.buildPhotoPrompt ?? scope.buildPrompt;
  const scopeWithPhotoPrompt: AIScope = {
    ...scope,
    buildPrompt: promptFn,
  };

  const result = await runAI({ text: analysis, scope: scopeWithPhotoPrompt });

  return { ...result, analysis };
}
