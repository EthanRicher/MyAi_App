import { OPENAI_API_KEY } from "@env";
import { debugLog, debugPayload } from "../../_AI/AI_Debug";

/**
 * Whisper voice transcription. Takes a recorded audio file URI and
 * returns the spoken text in English plus the detected source
 * language. The chat surface uses the language field to decide
 * whether to stamp a grey "Translated" chip on the user bubble.
 *
 * Uses the /audio/translations endpoint exclusively:
 * - Always outputs English, which is what the downstream chat
 *   pipeline (distress guard, keyword scanner, etc.) expects.
 * - One API call per recording — fast enough for a demo.
 * - With verbose_json we also get the detected source language for
 *   the Translated chip.
 *
 * Known limitation: on very short / accented clips Whisper sometimes
 * mislabels the source language as "english" when it was actually
 * Spanish / etc., which silently kills the Translated chip on those
 * clips. Acceptable trade-off for the demo where English is the
 * primary use case; a dual-call transcribe+translate variant lives
 * in git history if reliable cross-language detection becomes more
 * important than latency.
 *
 * On any failure path returns an "Error: ..." string so the caller
 * (the speech hook) can surface a friendly chat error.
 */

type WhisperTranscribeOptions = {
  model?: string;       // Optional model override; defaults to whisper-1.
  prompt?: string;      // Style / vocabulary hint passed straight to Whisper.
  temperature?: number; // Sampling temperature (lower is more literal).
};

/**
 * Result shape for whisperTranscribe.
 *
 * - `text` is the English output (always — for foreign speech this is
 *   the translation; for English speech this is the transcription).
 * - `language` is the detected source language (lowercase name like
 *   "english", "spanish", "mandarin chinese") when the API returned it.
 * - `sourceText` is the original-language transcript when the source
 *   is NOT English. For English speech it matches `text`. Used by the
 *   chat surface to render an original-language bubble alongside the
 *   English translation, matching the typed-foreign flow.
 *
 * On errors `text` starts with "Error:" and the rest are undefined.
 */
export type WhisperResult = {
  text: string;
  language?: string;
  sourceText?: string;
};

const ENGLISH_LANGUAGE_VALUES = new Set(["english", "en"]);

/** True when the detected language counts as English (any casing). */
export const isEnglishLanguage = (language?: string) => {
  if (!language) return true;
  return ENGLISH_LANGUAGE_VALUES.has(language.trim().toLowerCase());
};

/**
 * Phantom transcripts Whisper emits on silent or near-silent audio.
 * The model hallucinates a common short token because "silence" isn't
 * in its vocabulary — usually "you", "thanks", "bye", or punctuation.
 * Treat these as no-speech rather than passing them downstream as if
 * the user actually said something.
 */
const PHANTOM_TRANSCRIPTS = new Set([
  "you",
  "thank you",
  "thanks",
  "thanks for watching",
  "thanks for watching!",
  "thank you for watching",
  "bye",
  "bye.",
  "okay",
  "ok",
  "uh",
  "um",
  "hmm",
  "music",
  "[music]",
  "(music)",
  ".",
  "!",
  "?",
]);

const isPhantomTranscript = (text: string): boolean => {
  const normalised = text.trim().toLowerCase().replace(/[.!?,]+$/, "").trim();
  return !normalised || PHANTOM_TRANSCRIPTS.has(normalised);
};

// Shared form-data builder for both endpoints. Same audio file, same
// model, same options; only the endpoint URL differs.
const buildForm = (uri: string, options: WhisperTranscribeOptions) => {
  const formData = new FormData();
  formData.append(
    "file",
    {
      uri,
      name: "recording.m4a",
      type: "audio/m4a",
    } as any
  );
  formData.append("model", options.model || "whisper-1");
  formData.append("response_format", "verbose_json");
  if (options.prompt) formData.append("prompt", options.prompt);
  if (typeof options.temperature === "number") {
    formData.append("temperature", String(options.temperature));
  }
  return formData;
};

// Hit one Whisper endpoint and return { text, language } or null on
// failure. Failures log but don't throw — the caller decides how to
// recover.
const callWhisper = async (
  endpoint: "transcriptions" | "translations",
  uri: string,
  options: WhisperTranscribeOptions
): Promise<{ text: string; language?: string } | null> => {
  const res = await fetch(`https://api.openai.com/v1/audio/${endpoint}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: buildForm(uri, options),
  });

  if (!res.ok) {
    const errText = await res.text();
    debugLog("Input_Whisper", "Error", `${endpoint} failed`, {
      status: res.status,
      message: errText,
    });
    return null;
  }

  const data = await res.json();
  const text = typeof data?.text === "string" ? data.text.trim() : "";
  const language =
    typeof data?.language === "string" ? data.language.trim() : undefined;
  return { text, language };
};

export const whisperTranscribe = async (
  uri: string,
  options: WhisperTranscribeOptions = {}
): Promise<WhisperResult> => {
  try {
    if (!uri) {
      debugLog("Input_Whisper", "Error", "No audio file");
      return { text: "Error: No audio file" };
    }

    debugLog("Input_Whisper", "Request", "Sending audio");

    const result = await callWhisper("translations", uri, options);
    if (!result) {
      return { text: "Error: Whisper API failed" };
    }

    const { text, language } = result;

    debugLog("Input_Whisper", "Response", "Transcribed", {
      chars: text.length,
      language: language ?? "unknown",
    });
    debugPayload("Input_Whisper", "transcript", text);

    if (!text) {
      return { text: "Error: No speech detected" };
    }

    // Filter Whisper's silent-audio hallucinations — see
    // PHANTOM_TRANSCRIPTS above. Without this, holding the mic and
    // releasing without speaking produces a phantom "you" / "thanks"
    // bubble every time.
    if (isPhantomTranscript(text)) {
      debugLog("Input_Whisper", "Filtered", "Phantom transcript", { text });
      return { text: "Error: No speech detected" };
    }

    return { text, language };
  } catch (err: any) {
    debugLog("Input_Whisper", "Error", "Whisper crashed", { message: err?.message || "Whisper crashed" });
    return { text: "Error: Whisper crashed" };
  }
};
