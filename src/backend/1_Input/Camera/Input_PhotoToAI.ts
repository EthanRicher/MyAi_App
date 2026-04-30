import { AIScope, RunAIResult } from "../../_AI/AI_Types";
import { runAI } from "../../_AI/AI_Run";
import { runVision } from "./Input_Vision";
import { runOCR } from "./Input_OCR";
import { PhotoMode } from "./Input_Camera";

export async function runAIOnPhoto(
  imageUri: string,
  scope: AIScope,
  mode: PhotoMode = PhotoMode.VisionWithFallback
): Promise<RunAIResult & { analysis: string }> {
  let analysis = "";

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

  if (!analysis) {
    return {
      analysis: "",
      error: "The photo could not be read. Please try again with a clearer image.",
    };
  }

  const promptFn = scope.buildPhotoPrompt ?? scope.buildPrompt;
  const scopeWithPhotoPrompt: AIScope = {
    ...scope,
    buildPrompt: promptFn,
  };

  const result = await runAI({ text: analysis, scope: scopeWithPhotoPrompt });

  return { ...result, analysis };
}
