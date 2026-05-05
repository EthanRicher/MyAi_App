import { OPENAI_API_KEY } from "@env";
import { debugLog, debugPayload, formatTime } from "./AI_Debug";
import { RunAIArgs, RunAIResult } from "./AI_Types";
import { BREAKDOWN_CHAR_LIMITS, DEFAULT_BREAKDOWN_LENGTH } from "../../config/Config_General";

/**
 * Main AI runner. Takes a scope (prompt builder, response format,
 * etc.) and the user text, talks to OpenAI, then runs the result
 * through the scope's mapOutput. Handles JSON parsing, length
 * limits, and a legacy structured-text fallback for old prompts
 * that didn't return strict JSON.
 */

// Strip null and control characters so weird input doesn't crash JSON parsing.
const sanitiseText = (value: any) => {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/\u0000/g, "")
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim();
};

// Pull out the first { ... } and / or [ ... ] blocks as JSON candidates.
const extractJsonBlock = (raw: string) => {
  const candidates: string[] = [];

  const firstObject = raw.indexOf("{");
  const lastObject = raw.lastIndexOf("}") + 1;

  if (firstObject >= 0 && lastObject > firstObject) {
    candidates.push(raw.substring(firstObject, lastObject));
  }

  const firstArray = raw.indexOf("[");
  const lastArray = raw.lastIndexOf("]") + 1;

  if (firstArray >= 0 && lastArray > firstArray) {
    candidates.push(raw.substring(firstArray, lastArray));
  }

  return candidates;
};

// Try parsing the raw text and each extracted block, returning the first one that parses.
const parseJsonSafely = (raw: string) => {
  const attempts = [raw, ...extractJsonBlock(raw)];

  for (const attempt of attempts) {
    try {
      return JSON.parse(attempt);
    } catch {}
  }

  return null;
};

// Legacy fallback. Some scopes used to return EXPLANATION / STATUS / MEDICATIONS plain text.
const parseLegacyStructuredResponse = (raw: string) => {
  const explanationMatch = raw.match(/EXPLANATION:\s*([\s\S]*?)(?:\n\s*STATUS:|$)/i);
  const statusMatch = raw.match(/STATUS:\s*(Valid|Invalid)/i);
  const medsMatch = raw.match(/MEDICATIONS:\s*([\s\S]*)$/i);

  let medications: any[] = [];

  try {
    const medsSection = medsMatch?.[1] || "";
    const start = medsSection.indexOf("[");
    const end = medsSection.lastIndexOf("]") + 1;

    if (start >= 0 && end > start) {
      medications = JSON.parse(medsSection.substring(start, end));
    }
  } catch {}

  return {
    explanation: explanationMatch?.[1]?.trim() || "",
    status: statusMatch?.[1] || "",
    medications,
  };
};

// Length cap appended to every prompt so replies stay scannable.
const buildLengthRule = (maxChars: number) => `

LENGTH LIMIT (critical):
- Keep the breakdown under ${maxChars} characters total (including titles and bullets).
- Prefer short sentences. Cut anything non-essential.
- If the topic is too big, cover only the most important points.`;

export const runAI = async ({
  text,
  scope,
  breakdownLength,
}: RunAIArgs): Promise<RunAIResult> => {
  // Build the prompt. Scope-specific text plus the shared length rule.
  const safeText = sanitiseText(text);
  const basePrompt = scope.buildPrompt(safeText);
  const maxChars = BREAKDOWN_CHAR_LIMITS[breakdownLength ?? DEFAULT_BREAKDOWN_LENGTH];
  const prompt = sanitiseText(basePrompt + buildLengthRule(maxChars));

  debugLog("AI_Run", "Request", "Sending", { scope: scope.id, model: "gpt-4o-mini" });
  debugPayload("AI_Run", "prompt", prompt);

  const requestBody: any = {
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0,
  };

  if (scope.responseFormat === "json") {
    requestBody.response_format = { type: "json_object" };
  }

  const requestJson = JSON.stringify(requestBody);

  // Network call.
  const startedAt = Date.now();
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: requestJson,
  });

  // Error path. Try to pull a useful message out of the error body.
  if (!response.ok) {
    const errText = await response.text();
    let err: any = errText;

    try {
      err = JSON.parse(errText);
    } catch {}

    debugLog("AI_Run", "Error", "API failed", {
      status: response.status,
      message: typeof err === "string" ? err : err?.error?.message || "AI request failed",
    });
    return {
      error:
        typeof err === "string"
          ? err
          : err?.error?.message || "AI request failed",
    };
  }

  const data = await response.json();
  const raw = sanitiseText(data?.choices?.[0]?.message?.content || "");
  const elapsed = Date.now() - startedAt;

  debugLog("AI_Run", "Response", "Received", { chars: raw.length, took: formatTime(elapsed) });
  debugPayload("AI_Run", "raw_response", raw);

  // Parse depending on the requested format. JSON scopes try strict JSON first, then the legacy fallback.
  let parsed: any = {};

  if (scope.responseFormat === "json") {
    const jsonParsed = parseJsonSafely(raw);

    if (jsonParsed !== null) {
      parsed = jsonParsed;
    } else {
      parsed = parseLegacyStructuredResponse(raw);
      debugLog("AI_Run", "Error", "Failed to parse JSON response");
    }
  } else {
    parsed = parseLegacyStructuredResponse(raw);
  }

  const output = scope.mapOutput ? scope.mapOutput(parsed) : parsed;

  return {
    raw,
    parsed,
    output,
  };
};
