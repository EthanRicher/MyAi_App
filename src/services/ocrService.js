import { OCR_API_KEY } from "@env";

export const runOCR = async (imageUri) => {
  try {
    const formData = new FormData();

    formData.append("file", {
      uri: imageUri,
      type: "image/jpeg",
      name: "photo.jpg",
    });

    const res = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      headers: { apikey: OCR_API_KEY },
      body: formData,
    });

    const data = await res.json();

    return data?.ParsedResults?.[0]?.ParsedText || "";
  } catch {
    return "";
  }
};