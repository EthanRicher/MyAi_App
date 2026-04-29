import { AIScope } from "../../core/types";
import { buildSharedPrompt, buildSharedPhotoPrompt } from "../_shared";

export type ScamLevel = "low" | "med" | "high";

export type ScamCheckOutput = {
  level: ScamLevel;
  verdict: string;
  redFlags: string[];
  explanation: string;
};

const TOPIC = "check whether something looks like a scam";

const PROMPT_BODY = (subject: string) => `
You are a scam-detection assistant for an elderly person. Read what the user has provided below and decide how likely it is to be a scam.

${subject}

Return ONLY valid JSON in this exact shape:

{
  "level": "<one of: low, med, high>",
  "verdict": "<short one-liner the user can read at a glance>",
  "redFlags": ["<observation 1>", "<observation 2>", ...],
  "explanation": "<plain English explanation, 1-3 short sentences>"
}

LEVEL rules:
- "high" — clearly a scam: requests for money, PINs, account access, urgency threats, fake authority, prizes the user did not enter, asks to keep secret, suspicious or strange URLs, impersonation of bank / government / family / tech support.
- "med" — has some suspicious traits but could still be legitimate; needs verification before acting.
- "low" — looks normal or expected: a bill from a service the user actually uses, a message from someone they recognise, no money request, no urgency, no link/login asks.

VERDICT examples:
- high: "Likely a scam — do not respond"
- med: "Be careful — verify before acting"
- low: "Looks normal — but check if unsure"

RED FLAGS:
- 2 to 5 short bullets pointing to specific cues in the message.
- For low-risk results, list reassuring observations instead (e.g. "Mentions an account you actually have", "No urgency or money request").

EXPLANATION:
- Plain language. Don't lecture. State the reasoning briefly.
- If high or med: tell them what NOT to do (click links, send money, share info).
- If low: still suggest calling the organisation on a number they trust if anything feels off.
`;

export const safeHarbourScamCheck: AIScope = {
  id: "safeHarbourScamCheck",
  topic: TOPIC,
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

  mapOutput: (parsed: any): ScamCheckOutput => ({
    level: ["low", "med", "high"].includes(parsed?.level) ? parsed.level : "med",
    verdict: typeof parsed?.verdict === "string" ? parsed.verdict.trim() : "",
    redFlags: Array.isArray(parsed?.redFlags)
      ? parsed.redFlags.filter((s: any) => typeof s === "string").map((s: string) => s.trim()).filter(Boolean)
      : [],
    explanation: typeof parsed?.explanation === "string" ? parsed.explanation.trim() : "",
  }),
};
