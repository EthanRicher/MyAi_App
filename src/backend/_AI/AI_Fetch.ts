import { OPENAI_API_KEY } from "@env";
import { debugLog, debugPayload, formatTime } from "./AI_Debug";

/**
 * Shared low-level OpenAI call for the small classifier-style scopes
 * (translate, ai-flag, save-offer, etc.). All of them use the same
 * model, temperature, JSON response shape and error-handling
 * pattern, so the boilerplate lives here. Returns the parsed JSON
 * object or null on any failure (network error, non-2xx, malformed
 * JSON). Callers stay tiny; they just write the prompt and read
 * fields off the result.
 *
 * AI_Run.ts has its own fetch on purpose. It runs full AIScope
 * objects with buildPrompt / mapOutput / breakdown-length and a non
 * JSON path. This helper is only for the JSON-only classifiers.
 */

const ENDPOINT = "https://api.openai.com/v1/chat/completions";

export async function callOpenAIJson<T = any>(
  tag: string,    // Module label used in debug logs.
  prompt: string  // The full prompt to send.
): Promise<T | null> {
  // Same model / temperature / response shape for every classifier.
  const requestBody = {
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0,
    response_format: { type: "json_object" },
  };

  debugLog(tag, "Request", "Sending");
  debugPayload(tag, "prompt", prompt);

  const startedAt = Date.now();
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    const elapsed = Date.now() - startedAt;

    if (!res.ok) {
      debugLog(tag, "Error", "API failed", { status: res.status, took: formatTime(elapsed) });
      return null;
    }

    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content || "";
    const parsed = JSON.parse(raw);
    debugLog(tag, "Response", "Received", { took: formatTime(elapsed) });
    debugPayload(tag, "raw", parsed);
    return parsed as T;
  } catch (err) {
    debugLog(tag, "Error", "Exception", { message: String(err) });
    return null;
  }
}
