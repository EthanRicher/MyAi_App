import { AIScope } from "../../_AI/AI_Types";
import { buildSharedPrompt } from "../_Common";

const TOPIC = "log a symptom";

export type SymptomLogOutput = {
  title: string;
  summary: string;
  severity: number;
};

export const senseguardSymptomLog: AIScope = {
  id: "senseguardSymptomLog",
  responseFormat: "json",

  buildPrompt: (text: string) =>
    buildSharedPrompt(
      `
You are a symptom logger for an elderly person. Read the freeform description below and produce a clean, structured log entry.

USER DESCRIPTION:
${text}

Return ONLY valid JSON in this exact shape:

{
  "title": "<short concise title, max 40 characters, sentence case, no quotes>",
  "summary": "<plain English summary of the symptoms — one fact per line, each line starting with '- '>",
  "severity": <integer between 1 and 6>
}

TITLE rules:
- Short and specific, e.g. "Sharp chest pain", "Headache after lunch", "Dizzy when standing up".
- Sentence case. No leading/trailing punctuation.

SUMMARY rules:
- One short sentence per "- " bullet line.
- Cover where it is, what it feels like, when it started, any triggers, related symptoms.
- Do NOT invent details — only restate what the user said.
- If the description is vague, summarise what little is there. Don't pad it.

SEVERITY rules (best estimate from the words used):
- 1 = mild / barely noticeable
- 2 = mild but persistent
- 3 = moderate / interfering with the day
- 4 = significant
- 5 = severe
- 6 = very severe / urgent (chest pain, breathing difficulty, sudden weakness, severe bleeding)
- If the user uses urgent language ("can't breathe", "severe", "really bad", "emergency", "passing out"), lean high.
`.trim(),
      "auto",
      TOPIC
    ),

  mapOutput: (parsed: any): SymptomLogOutput => ({
    title: typeof parsed?.title === "string" ? parsed.title.trim() : "",
    summary: typeof parsed?.summary === "string" ? parsed.summary.trim() : "",
    severity:
      typeof parsed?.severity === "number"
        ? Math.max(1, Math.min(6, Math.round(parsed.severity)))
        : 3,
  }),
};
