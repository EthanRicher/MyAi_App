import { runOCR } from "../ocrService";
import { processWithAI } from "../aiService";
import { parseMedicationAI } from "../parsers/medicationParser";

export const runImagePipelineService = async (image, aiType) => {
  try {
    if (!image) {
      return { error: "No image provided" };
    }

    const text = await runOCR(image);

    if (!text || text === "OCR failed") {
      return { error: "OCR failed or no text detected" };
    }

    const result = await processWithAI(text, aiType);

    if (!result) {
      return { error: "AI returned nothing" };
    }

    const meds = parseMedicationAI(result);

    return {
      text,
      ai: result,
      meds,
    };
  } catch (err) {
    return { error: err.message || "Image pipeline crashed" };
  }
};