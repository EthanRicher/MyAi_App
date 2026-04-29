import { OPENAI_API_KEY } from "@env";
import { addDebugEntry } from "./debug";

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

  const requestBody = {
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: PROMPT + trimmed }],
    temperature: 0,
    response_format: { type: "json_object" },
  };

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      addDebugEntry("translate", "error", await res.text());
      return { needed: false };
    }

    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content || "";
    const parsed = JSON.parse(raw);
    addDebugEntry("translate", "result", parsed);

    return {
      needed: !!parsed.needed,
      translated: parsed.translated || undefined,
      language: parsed.language || undefined,
    };
  } catch (err) {
    addDebugEntry("translate", "exception", String(err));
    return { needed: false };
  }
}
