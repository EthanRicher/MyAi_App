import { OPENAI_API_KEY } from "@env";
import { debugLog, debugPayload } from "../../_AI/AI_Debug";

type WhisperTranscribeOptions = {
  model?: string;
  language?: string;
  prompt?: string;
  temperature?: number;
};

export const whisperTranscribe = async (
  uri: string,
  options: WhisperTranscribeOptions = {}
) => {
  try {
    if (!uri) {
      debugLog("Input_Whisper", "Error", "No audio file");
      return "Error: No audio file";
    }

    debugLog("Input_Whisper", "Request", "Sending audio");

    const formData = new FormData();

    formData.append(
      "file",
      {
        uri,
        name: "recording.m4a",
        type: "audio/m4a",
      } as any
    );

    formData.append("model", options.model || "gpt-4o-mini-transcribe");

    if (options.language) {
      formData.append("language", options.language);
    }

    if (options.prompt) {
      formData.append("prompt", options.prompt);
    }

    if (typeof options.temperature === "number") {
      formData.append("temperature", String(options.temperature));
    }

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const errText = await res.text();
      debugLog("Input_Whisper", "Error", "API failed", { status: res.status, message: errText });
      return "Error: Whisper API failed";
    }

    const data = await res.json();
    const text = data?.text?.trim();

    debugLog("Input_Whisper", "Response", "Transcribed", { chars: (text || "").length });
    debugPayload("Input_Whisper", "transcript", text || "");

    if (!text) {
      return "Error: No speech detected";
    }

    return text;
  } catch (err: any) {
    debugLog("Input_Whisper", "Error", "Whisper crashed", { message: err?.message || "Whisper crashed" });
    return "Error: Whisper crashed";
  }
};
