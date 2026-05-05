import { callOpenAIJson } from "../../_AI/AI_Fetch";
import { debugLog, debugPayload } from "../../_AI/AI_Debug";

/**
 * Detects whether a user message is in English; if not, returns its
 * English translation. Used by ChatScreen so foreign-language input
 * gets surfaced as a translated bubble before being passed to the
 * main scope prompt.
 */

export type TranslateResult = {
  needed: boolean;       // True when the message had to be translated.
  translated?: string;   // The English translation when needed is true.
  language?: string;     // Detected source language code (e.g. "en", "es").
};

const PROMPT = `You are a language detector and translator.
Decide whether the user message below is written in English.

Return ONLY valid JSON with this exact shape:
{ "language": "<two-letter ISO code>", "needed": <boolean>, "translated": "<english translation OR empty string>" }

Rules:
- Default strongly to English. Only set "needed": true when the message clearly contains words that are NOT in the English vocabulary at all.
- If the message is in English: { "language": "en", "needed": false, "translated": "" }
- Single English words — even charged or loaded ones like "suicide", "emergency", "help", "hurt", "pain", "ok", "thanks" — count as English. Do NOT translate them.
- A single English word that originally came from another language (Latin, Greek, French, etc.) is still English. Do not flag etymology as foreign.
- A short English phrase (greeting, exclamation, single sentence) is English even if it contains a proper noun in another language.
- Code-mixed messages: if the bulk is English with a few foreign words, treat as English (needed: false).
- Only when the WHOLE message is in another language (Spanish, Mandarin, Arabic, etc.) do you set needed: true and provide the translation.
- If "needed" is true, "translated" MUST be a faithful English version that is meaningfully different from the original. If the translation would be identical to the input, return needed: false.
- Do NOT add commentary. JSON only.

USER MESSAGE:
`;

export async function translateToEnglish(text: string): Promise<TranslateResult> {
  const trimmed = (text || "").trim();
  if (!trimmed) return { needed: false };

  // Single OpenAI JSON call. The classifier returns language + needed + translated in one go.
  const parsed = await callOpenAIJson<{ needed: boolean; translated: string; language: string }>(
    "Check_Translate",
    PROMPT + trimmed
  );
  if (!parsed) return { needed: false };

  const translated =
    typeof parsed.translated === "string" ? parsed.translated.trim() : "";

  /**
   * Defensive guard. Drop the translation when the model declares it
   * "needed" but returns either nothing, the original text, or
   * English-tagged output. Stops single charged English words
   * ("suicide", "emergency") from showing a redundant translated
   * bubble below the user's message.
   */
  const language = parsed.language?.toLowerCase();
  const sameAsOriginal = translated.toLowerCase() === trimmed.toLowerCase();
  const meaningfulTranslation =
    !!parsed.needed && !!translated && !sameAsOriginal && language !== "en";

  const result: TranslateResult = {
    needed: meaningfulTranslation,
    translated: meaningfulTranslation ? translated : undefined,
    language: parsed.language || undefined,
  };

  debugLog("Check_Translate", "Result", "Detected", {
    language: result.language ?? "unknown",
    needed: result.needed,
  });
  if (result.needed && result.translated) {
    debugPayload("Check_Translate", "translated_text", result.translated);
  }

  return result;
}
