import { OPENAI_API_KEY } from "@env";
import { addDebugEntry } from "./AI_Debug";

// Shared low-level OpenAI call for the small classifier-style scopes
// (translate, ai-flag, save-offer, etc.). All of them use the same model,
// temperature, JSON response shape, and error-handling pattern, so the
// boilerplate lives here. Returns the parsed JSON object or null on any
// failure (network error, non-2xx, malformed JSON). Callers stay tiny —
// they just write the prompt and read fields off the result.
//
// AI_Run.ts has its own fetch on purpose: it runs full AIScope objects
// with buildPrompt/mapOutput/breakdown-length and a non-JSON path. This
// helper is only for the JSON-only classifiers.

const ENDPOINT = "https://api.openai.com/v1/chat/completions";

export async function callOpenAIJson<T = any>(
  tag: string,
  prompt: string
): Promise<T | null> {
  const requestBody = {
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0,
    response_format: { type: "json_object" },
  };

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      addDebugEntry(tag, "error", await res.text());
      return null;
    }

    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content || "";
    const parsed = JSON.parse(raw);
    addDebugEntry(tag, "result", parsed);
    return parsed as T;
  } catch (err) {
    addDebugEntry(tag, "exception", String(err));
    return null;
  }
}
