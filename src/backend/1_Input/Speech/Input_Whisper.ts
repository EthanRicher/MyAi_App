import { OPENAI_API_KEY } from "@env";
import { addDebugEntry } from "../../ai/core/debug";

export type WhisperTranscribeOptions = {
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
      addDebugEntry("Speech", "error", "No audio file");
      return "Error: No audio file";
    }

    addDebugEntry("Speech", "audio_uri", uri);
    addDebugEntry("Speech", "options", options);

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
      addDebugEntry("Speech", "error", errText || "Whisper API failed");
      return "Error: Whisper API failed";
    }

    const data = await res.json();

    addDebugEntry("Speech", "raw_response", data);

    const text = data?.text?.trim();

    addDebugEntry("Speech", "transcript", text || "");

    if (!text) {
      return "Error: No speech detected";
    }

    return text;
  } catch (err: any) {
    addDebugEntry("Speech", "error", err?.message || "Whisper crashed");
    return "Error: Whisper crashed";
  }
};