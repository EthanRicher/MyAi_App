import { OPENAI_API_KEY } from "@env";
import { debugLog, debugPayload } from "../../_AI/AI_Debug";

/**
 * Whisper voice transcription. Takes a recorded audio file URI and
 * returns the spoken text in English plus the detected source
 * language. The chat surface uses the language field to decide
 * whether to stamp a grey "Translated" chip on the user bubble.
 *
 * Dual-call flow so foreign speech can render the same two-bubble
 * pattern as typed-foreign input (original-language bubble, then
 * English-translation bubble with a "Translated" chip):
 * - /audio/transcriptions first → original-language text + detected
 *   language. If the language is English we're done.
 * - /audio/translations second when non-English → English text. The
 *   chat surface gets both via `sourceText` (original) and `text`
 *   (English).
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

    // First call: transcribe in the source language so we get both
    // the original-language text and the detected language code.
    const transcription = await callWhisper("transcriptions", uri, options);
    if (!transcription) {
      return { text: "Error: Whisper API failed" };
    }

    const sourceText = transcription.text;
    const language = transcription.language;

    debugLog("Input_Whisper", "Response", "Transcribed", {
      chars: sourceText.length,
      language: language ?? "unknown",
    });
    debugPayload("Input_Whisper", "transcript", sourceText);

    if (!sourceText) {
      return { text: "Error: No speech detected" };
    }

    // Filter Whisper's silent-audio hallucinations — see
    // PHANTOM_TRANSCRIPTS above. Without this, holding the mic and
    // releasing without speaking produces a phantom "you" / "thanks"
    // bubble every time.
    if (isPhantomTranscript(sourceText)) {
      debugLog("Input_Whisper", "Filtered", "Phantom transcript", { text: sourceText });
      return { text: "Error: No speech detected" };
    }

    // English speech: the transcription IS the English text, so we
    // skip the second call. No sourceText — the chat renders one
    // bubble with no Translated chip.
    if (isEnglishLanguage(language)) {
      return { text: sourceText, language };
    }

    // Non-English speech: second call to translate to English so the
    // chat can render the original-language bubble followed by the
    // English bubble with the Translated chip.
    const translation = await callWhisper("translations", uri, options);
    if (!translation || !translation.text || isPhantomTranscript(translation.text)) {
      // Fallback: surface the source-language transcript so the user
      // still sees their words rather than losing the bubble entirely.
      return { text: sourceText, language };
    }

    return { text: translation.text, language, sourceText };
  } catch (err: any) {
    debugLog("Input_Whisper", "Error", "Whisper crashed", { message: err?.message || "Whisper crashed" });
    return { text: "Error: Whisper crashed" };
  }
};
