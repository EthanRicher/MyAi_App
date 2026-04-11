import { OPENAI_API_KEY } from "@env";

export const whisperTranscribe = async (uri) => {
  try {
    if (!uri) return "Error: No audio file";

    const formData = new FormData();

    formData.append("file", {
      uri,
      name: "recording.m4a",
      type: "audio/m4a",
    });

    formData.append("model", "gpt-4o-mini-transcribe");

    const res = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: formData,
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.log("Whisper error:", errText);
      return "Error: Whisper API failed";
    }

    const data = await res.json();

    const text = data?.text?.trim();

    if (!text) {
      return "Error: No speech detected";
    }

    return text;
  } catch (err) {
    console.log("Whisper crash:", err);
    return "Error: Whisper crashed";
  }
};