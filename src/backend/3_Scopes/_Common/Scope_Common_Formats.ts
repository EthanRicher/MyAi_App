import { BASE_RULES, buildRelevanceRule, buildPhotoRelevanceRule } from "./Scope_Common_Rules";

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

const CONVERSATIONAL_FORMAT = `
RESPONSE FORMAT:
- Reply naturally and conversationally in 1–3 short sentences
- Only use "- " bullet points if you are listing more than 3 things
- No structured titles or headers
- Keep it warm, friendly, and simple
- Plain language easy for an elderly person to read
`.trim();

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

const pickFormatBlock = (format: Format): string =>
  format === "conversational" ? CONVERSATIONAL_FORMAT
  : format === "auto" ? AUTO_FORMAT
  : BREAKDOWN_FORMAT;

export const buildSharedPrompt = (
  body: string,
  format: Format = "breakdown",
  topic?: string
) => {
  const rules = `${BASE_RULES}\n- ${buildRelevanceRule(topic)}`;
  return `${rules}\n\n${pickFormatBlock(format)}\n\n${body}`;
};

export const buildSharedPhotoPrompt = (
  body: string,
  format: Format = "breakdown",
  topic?: string
) => {
  const rules = `${BASE_RULES}\n- ${buildPhotoRelevanceRule(topic)}`;
  return `${rules}\n\n${pickFormatBlock(format)}\n\n${body}`;
};
