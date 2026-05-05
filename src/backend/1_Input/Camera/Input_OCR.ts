import { OCR_API_KEY } from "@env";
import { debugLog, debugPayload } from "../../_AI/AI_Debug";

/**
 * Plain text extraction from an image using ocr.space. Cheap and
 * reliable for clear printed text, used as the fallback when the
 * Vision model returns nothing useful.
 */

export const runOCR = async (imageUri: string) => {
  try {
    // Build the multipart form. ocr.space wants the image as a file blob.
    const formData = new FormData();

    formData.append("file", {
      uri: imageUri,
      type: "image/jpeg",
      name: "photo.jpg",
    } as any);

    formData.append("language", "eng");
    formData.append("OCREngine", "2");

    const res = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      headers: {
        apikey: OCR_API_KEY,
      },
      body: formData,
    });

    const data = await res.json();

    const text = data?.ParsedResults?.[0]?.ParsedText?.trim() || "";

    debugLog("Input_OCR", "Result", "Text extracted", { chars: text.length });
    debugPayload("Input_OCR", "raw_text", text);

    return text;
  } catch (error: any) {
    debugLog("Input_OCR", "Error", "OCR failed", { message: error?.message || "OCR failed" });
    return "";
  }
};
