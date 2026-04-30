import { OCR_API_KEY } from "@env";
import { addDebugEntry } from "../../4_AI/AI_Debug";

export const runOCR = async (imageUri: string) => {
  try {
    addDebugEntry("OCR", "image_uri", imageUri);

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

    addDebugEntry("OCR", "raw_response", data);

    const text = data?.ParsedResults?.[0]?.ParsedText?.trim() || "";

    addDebugEntry("OCR", "text", text);

    return text;
  } catch (error: any) {
    addDebugEntry("OCR", "error", error?.message || "OCR failed");
    return "";
  }
};