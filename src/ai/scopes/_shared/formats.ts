import { BASE_RULES, buildRelevanceRule, buildPhotoRelevanceRule } from "./rules";

export const BREAKDOWN_FORMAT = `
RESPONSE FORMAT (always follow exactly):
- First line: short main title in double asterisks — **Title Here** (max 30 characters, no colons)
- Leave a blank line after the main title
- Use **Subtitle** to introduce each section (max 30 characters, no colons)
- Use "- " bullet points under each section
- Use plain sentences for brief explanations between sections
- No other markdown, no numbered lists, no colons in any title
- Plain simple language easy for an elderly person to read
`.trim();

export const CONVERSATIONAL_FORMAT = `
RESPONSE FORMAT:
- Reply naturally and conversationally in 1–3 short sentences
- Only use "- " bullet points if you are listing more than 3 things
- No structured titles or headers
- Keep it warm, friendly, and simple
- Plain language easy for an elderly person to read
`.trim();

export const AUTO_FORMAT = `
RESPONSE FORMAT (you decide):
- If the message asks for an explanation, facts, trivia, steps, or structured information: use breakdown format — start with **Title** (max 30 chars), then **Subtitle** sections with "- " bullet points
- If the message is conversational, emotional, a simple question, or casual chat: reply naturally in 1–3 short sentences with no titles or bullets
- Never mix both styles in the same response
- Plain simple language easy for an elderly person to read
`.trim();

export const buildSharedPrompt = (
  body: string,
  format: "breakdown" | "conversational" | "auto" = "breakdown",
  topic?: string
) => {
  const rules = `${BASE_RULES}\n- ${buildRelevanceRule(topic)}`;
  const formatBlock =
    format === "conversational" ? CONVERSATIONAL_FORMAT
    : format === "auto" ? AUTO_FORMAT
    : BREAKDOWN_FORMAT;
  return `${rules}\n\n${formatBlock}\n\n${body}`;
};

export const buildSharedPhotoPrompt = (
  body: string,
  format: "breakdown" | "conversational" | "auto" = "breakdown",
  topic?: string
) => {
  const rules = `${BASE_RULES}\n- ${buildPhotoRelevanceRule(topic)}`;
  const formatBlock =
    format === "conversational" ? CONVERSATIONAL_FORMAT
    : format === "auto" ? AUTO_FORMAT
    : BREAKDOWN_FORMAT;
  return `${rules}\n\n${formatBlock}\n\n${body}`;
};
