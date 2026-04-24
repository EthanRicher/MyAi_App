import { OPENAI_API_KEY } from "@env";
import { addDebugEntry } from "./debug";
import { RunAIArgs, RunAIResult } from "./types";
import { BREAKDOWN_CHAR_LIMITS, DEFAULT_BREAKDOWN_LENGTH } from "../../config/breakdownSettings";

const sanitiseText = (value: any) => {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/\u0000/g, "")
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim();
};

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

const parseJsonSafely = (raw: string) => {
  const attempts = [raw, ...extractJsonBlock(raw)];

  for (const attempt of attempts) {
    try {
      return JSON.parse(attempt);
    } catch {}
  }

  return null;
};

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
  const safeText = sanitiseText(text);
  const basePrompt = scope.buildPrompt(safeText);
  const maxChars = BREAKDOWN_CHAR_LIMITS[breakdownLength ?? DEFAULT_BREAKDOWN_LENGTH];
  const prompt = sanitiseText(basePrompt + buildLengthRule(maxChars));

  addDebugEntry("runAI", "input_text", safeText);
  addDebugEntry("runAI", "scope", {
    id: scope.id,
    responseFormat: scope.responseFormat || "text",
  });
  addDebugEntry("runAI", "prompt", prompt);

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

  addDebugEntry("runAI", "request_json", requestJson);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: requestJson,
  });

  if (!response.ok) {
    const errText = await response.text();
    let err: any = errText;

    try {
      err = JSON.parse(errText);
    } catch {}

    addDebugEntry("runAI", "error", err || "AI request failed");
    return {
      error:
        typeof err === "string"
          ? err
          : err?.error?.message || "AI request failed",
    };
  }

  const data = await response.json();
  const raw = sanitiseText(data?.choices?.[0]?.message?.content || "");

  addDebugEntry("runAI", "raw_response", raw);

  let parsed: any = {};

  if (scope.responseFormat === "json") {
    const jsonParsed = parseJsonSafely(raw);

    if (jsonParsed !== null) {
      parsed = jsonParsed;
    } else {
      parsed = parseLegacyStructuredResponse(raw);
      addDebugEntry("runAI", "json_parse_error", "Failed to parse JSON response");
    }
  } else {
    parsed = parseLegacyStructuredResponse(raw);
  }

  addDebugEntry("runAI", "parsed", parsed);

  const output = scope.mapOutput ? scope.mapOutput(parsed) : parsed;

  addDebugEntry("runAI", "output", output);

  return {
    raw,
    parsed,
    output,
  };
};