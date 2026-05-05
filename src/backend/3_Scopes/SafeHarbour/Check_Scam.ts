import { AIScope } from "../../_AI/AI_Types";
import { buildSharedPrompt, buildSharedPhotoPrompt } from "../_Common";

/**
 * SafeHarbour scam check scope. Reads a message, email, or photo of
 * something the user wants checked, then returns a level (low / med
 * / high / unsure), a one-line verdict, a few short red-flag bullets
 * and a plain-English explanation.
 */

export type ScamLevel = "low" | "med" | "high" | "unsure";

// Result shape used by the SafeHarbour screen.
export type ScamCheckOutput = {
  level: ScamLevel;        // Risk band the AI assigned.
  verdict: string;         // Short headline ("Likely a scam — don't respond" etc.).
  redFlags: string[];      // Up to 3 short bullets calling out specific cues.
  explanation: string;     // One-sentence plain-English explanation.
};

const TOPIC = "check whether something looks like a scam";

// Shared prompt body. The text-vs-photo wrappers slot a different "subject" block in.
const PROMPT_BODY = (subject: string) => `
You are a scam-detection assistant for an elderly person. Read what the user has provided below and decide how likely it is to be a scam.

${subject}

Return ONLY valid JSON in this exact shape:

{
  "level": "<one of: low, med, high, unsure>",
  "verdict": "<short one-liner the user can read at a glance>",
  "redFlags": ["<observation 1>", "<observation 2>", ...],
  "explanation": "<plain English explanation, 1-3 short sentences>"
}

LEVEL rules:
- "high" — clearly a scam: requests for money, PINs, account access, urgency threats, fake authority, prizes the user did not enter, asks to keep secret, suspicious or strange URLs, impersonation of bank / government / family / tech support.
- "med" — has some suspicious traits but could still be legitimate; needs verification before acting.
- "low" — looks normal or expected: a bill from a service the user actually uses, a message from someone they recognise, no money request, no urgency, no link/login asks.
- "unsure" — the input is NOT something a scam check applies to, OR there is not enough information to make any judgement. Use this when:
  - The text/photo is unrelated (a recipe, a personal note, a random snapshot, gibberish, empty content).
  - The input is too short, vague, or off-topic to assess as a possible scam.
  - You genuinely cannot tell — do NOT default to "med" just to fill an answer. Pick "unsure" instead.

VERDICT (one short line, no longer than ~6 words):
- high: "Likely a scam — don't respond"
- med: "Be careful — verify first"
- low: "Looks normal"
- unsure: "Not enough to check"

RED FLAGS — KEEP TIGHT:
- 2 to 3 bullets MAX. Each bullet 4-7 words.
- Point to one specific cue per bullet. No padding, no full sentences.
- For low-risk: list reassuring observations the same short way (e.g. "Real account you use", "No money or link asked").
- For "unsure": list what's missing in 4-7 words (e.g. "Looks like a personal note", "Not enough text to judge").

EXPLANATION — KEEP TIGHT:
- ONE short sentence. Max ~20 words.
- Plain language. No lecturing. No restating the verdict.
- If high or med: name the single most important thing NOT to do (e.g. "Don't click the link or share details").
- If low: short reassurance.
- If unsure: ask them to share the actual message or screenshot.
`;

export const safeHarbourScamCheck: AIScope = {
  id: "safeHarbourScamCheck",
  responseFormat: "json",

  buildPrompt: (text: string) =>
    buildSharedPrompt(PROMPT_BODY(`MESSAGE / SITUATION:\n${text}`), "auto", TOPIC),

  buildPhotoPrompt: (analysis: string) =>
    buildSharedPhotoPrompt(
      PROMPT_BODY(
        `PHOTO ANALYSIS (the user has taken a photo of something they want checked — a screenshot of a message, an email, a letter, a website, a phone call screen, etc.):\n${analysis}`
      ),
      "auto",
      TOPIC
    ),

  // Normalise the JSON shape the model returns into ScamCheckOutput, defaulting bad data to "unsure".
  mapOutput: (parsed: any): ScamCheckOutput => ({
    level: ["low", "med", "high", "unsure"].includes(parsed?.level) ? parsed.level : "unsure",
    verdict: typeof parsed?.verdict === "string" ? parsed.verdict.trim() : "",
    redFlags: Array.isArray(parsed?.redFlags)
      ? parsed.redFlags.filter((s: any) => typeof s === "string").map((s: string) => s.trim()).filter(Boolean)
      : [],
    explanation: typeof parsed?.explanation === "string" ? parsed.explanation.trim() : "",
  }),
};
