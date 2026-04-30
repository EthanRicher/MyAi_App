import { callOpenAIJson } from "../../_AI/AI_Fetch";
import { debugLog, debugPayload } from "../../_AI/AI_Debug";

// Detects whether a user message is in English; if not, returns its English
// translation. Used by ChatScreen so foreign-language input gets surfaced as
// a translated bubble before being passed to the main scope prompt.

export type TranslateResult = {
  needed: boolean;
  translated?: string;
  language?: string;
};

const PROMPT = `You are a language detector and translator.
Decide whether the user message below is written in English.

Return ONLY valid JSON with this exact shape:
{ "language": "<two-letter ISO code>", "needed": <boolean>, "translated": "<english translation OR empty string>" }

Rules:
- If the message is in English: { "language": "en", "needed": false, "translated": "" }
- If the message is in any other language: { "language": "<code>", "needed": true, "translated": "<faithful, plain English translation>" }
- Single ambiguous words (e.g. "ok", "thanks") count as English.
- Do NOT add commentary. JSON only.

USER MESSAGE:
`;

export async function translateToEnglish(text: string): Promise<TranslateResult> {
  const trimmed = (text || "").trim();
  if (!trimmed) return { needed: false };

  const parsed = await callOpenAIJson<{ needed: boolean; translated: string; language: string }>(
    "Check_Translate",
    PROMPT + trimmed
  );
  if (!parsed) return { needed: false };

  const result: TranslateResult = {
    needed: !!parsed.needed,
    translated: parsed.translated || undefined,
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
