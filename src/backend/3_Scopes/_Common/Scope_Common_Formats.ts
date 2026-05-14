import { BASE_RULES, SCAN_BASE_RULES, buildRelevanceRule, buildPhotoRelevanceRule } from "./Scope_Common_Rules";

/**
 * Shared response-format blocks slotted into every scope prompt.
 * Three flavours: a structured "breakdown" with titles and bullets,
 * a casual "conversational" reply, and "auto" which lets the model
 * pick based on what kind of question it's getting.
 *
 * Prompts that go through buildSharedPrompt are split between the
 * model's system and user roles. The boundary is marked with
 * SYSTEM_USER_BOUNDARY so the runner (AI_Run) can split a single
 * string back into a two-message conversation. Everything before the
 * boundary goes in the system role (stable scaffolding — rules,
 * format, refusal patterns); everything after goes in the user role
 * (the per-turn task and input). Models adhere to format and safety
 * rules much more reliably when they live in the system role.
 *
 * If a scope's buildPrompt returns a string with no boundary, the
 * runner sends the whole thing as a user message (legacy / opt-out).
 */
export const SYSTEM_USER_BOUNDARY = "===SYSTEM_USER_BOUNDARY===";

// Structured reply. Title + sub-titles + bullets. Used for explainers and how-tos.
const BREAKDOWN_FORMAT = `
RESPONSE FORMAT (always follow exactly):
- First line: short main title in double asterisks — **Title Here** (max 30 characters, no colons)
- Leave a blank line after the main title
- Use **Subtitle** to introduce each section (max 30 characters, no colons)
- Use "- " bullet points under each section
- Use plain sentences for brief explanations between sections
- No other markdown, no numbered lists, no colons in any title
- Plain simple language easy for an elderly person to read
`.trim();

// Casual reply. Used for small talk, opinions, emotions.
const CONVERSATIONAL_FORMAT = `
RESPONSE FORMAT:
- Reply naturally and conversationally in 1–3 short sentences
- Only use "- " bullet points if you are listing more than 3 things
- No structured titles or headers
- Keep it warm, friendly, and simple
- Plain language easy for an elderly person to read
`.trim();

// Mixed reply. The model picks based on whether the question is informational or conversational.
const AUTO_FORMAT = `
RESPONSE FORMAT (you decide — pick ONE path):

USE BREAKDOWN FORMAT only when the user is asking you to teach, explain, define, or list something objective:
  - "explain / what is / how does / how do I / tell me about / walk me through / steps for / list of"
  - Factual, informational, or procedural questions with a real answer
  - Structure: **Title** (max 30 chars), then **Subtitle** sections with "- " bullet points

USE CONVERSATIONAL FORMAT for everything else — reply in 1–3 short sentences with NO titles, NO bullets, NO asterisks:
  - Opinion / favourites / preferences: "what rose do you like", "what's your favourite…", "which do you prefer"
  - Small talk, emotions, greetings: "how are you", "I'm feeling…", "that's nice"
  - Personal / subjective questions directed at you
  - Anything where a friend would just chat back, not teach

NEVER mix both styles in the same response.
When in doubt between the two, choose CONVERSATIONAL.
Plain simple language easy for an elderly person to read.
`.trim();

type Format = "breakdown" | "conversational" | "auto";

// Resolve the right format block for a given format key.
const pickFormatBlock = (format: Format): string =>
  format === "conversational" ? CONVERSATIONAL_FORMAT
  : format === "auto" ? AUTO_FORMAT
  : BREAKDOWN_FORMAT;

// Build the full text-input prompt: rules + format (system) | body (user).
export const buildSharedPrompt = (
  body: string,
  format: Format = "breakdown",
  topic?: string
) => {
  const rules = `${BASE_RULES}\n- ${buildRelevanceRule(topic)}`;
  return `${rules}\n\n${pickFormatBlock(format)}\n\n${SYSTEM_USER_BOUNDARY}\n\n${body}`;
};

// Same shape as the text prompt, but with the photo-friendly relevance rule.
export const buildSharedPhotoPrompt = (
  body: string,
  format: Format = "breakdown",
  topic?: string
) => {
  const rules = `${BASE_RULES}\n- ${buildPhotoRelevanceRule(topic)}`;
  return `${rules}\n\n${pickFormatBlock(format)}\n\n${SYSTEM_USER_BOUNDARY}\n\n${body}`;
};

/**
 * Prompt builder for one-shot scan / extraction scopes (MedView
 * medication scan, SafeHarbour scam check, SenseGuard symptom log).
 * Uses the minimal SCAN_BASE_RULES — no distress escalation, no tier
 * tag, no GP nudge, no relevance deflection, no format block. The
 * scope's own task body owns the output schema and the
 * invalid/unsure status semantics.
 */
export const buildScanPrompt = (body: string) => {
  return `${SCAN_BASE_RULES}\n\n${SYSTEM_USER_BOUNDARY}\n\n${body}`;
};
