import { OPENAI_API_KEY } from "@env";
import * as ImageManipulator from "expo-image-manipulator";
import { debugLog, debugPayload } from "../../_AI/AI_Debug";

const VISION_PROMPT = `Analyze this image thoroughly.

If it contains text (labels, documents, prescriptions, letters): extract all text exactly as written.
If it is a medication bottle or package: describe the name, dosage, instructions, and warnings in full.
If it is a medical document or letter: summarize the key information clearly.
Otherwise: describe what you see in helpful detail.

Be accurate and complete.`;

export async function runVision(imageUri: string): Promise<string> {
  try {
    debugLog("Input_Vision", "Request", "Sending photo to vision API");

    const base64Result = await ImageManipulator.manipulateAsync(
      imageUri,
      [],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );

    const base64 = base64Result.base64;
    if (!base64) throw new Error("No base64 output from manipulator");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64}`,
                  detail: "high",
                },
              },
              {
                type: "text",
                text: VISION_PROMPT,
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      debugLog("Input_Vision", "Error", "API failed", { status: response.status, message: err });
      throw new Error("Vision API request failed");
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content?.trim() || "";

    debugLog("Input_Vision", "Response", "Received", { chars: text.length });
    debugPayload("Input_Vision", "raw_response", text);
    return text;
  } catch (err: any) {
    debugLog("Input_Vision", "Error", "Vision failed", { message: err?.message || "Vision failed" });
    return "";
  }
}
