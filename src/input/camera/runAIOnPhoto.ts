import { AIScope, RunAIResult } from "../core/types";
import { runAI } from "../core/runAI";
import { runVision } from "./runVision";
import { runOCR } from "./ocrService";
import { PhotoMode } from "./cameraService";
import { addDebugEntry } from "../core/debug";

export async function runAIOnPhoto(
  imageUri: string,
  scope: AIScope,
  mode: PhotoMode = PhotoMode.VisionWithFallback
): Promise<RunAIResult & { analysis: string }> {
  addDebugEntry("runAIOnPhoto", "start", { scopeId: scope.id, mode });

  let analysis = "";

  if (mode === PhotoMode.OCR) {
    analysis = await runOCR(imageUri) || "";
  } else if (mode === PhotoMode.Vision) {
    analysis = await runVision(imageUri);
  } else {
    analysis = await runVision(imageUri);
    if (!analysis) {
      addDebugEntry("runAIOnPhoto", "vision_empty_falling_back_to_ocr", true);
      analysis = await runOCR(imageUri) || "";
    }
  }

  addDebugEntry("runAIOnPhoto", "analysis", analysis);

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

  addDebugEntry("runAIOnPhoto", "result", result);

  return { ...result, analysis };
}
