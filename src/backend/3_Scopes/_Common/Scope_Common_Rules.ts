/**
 * Rule fragments injected into every scope prompt. The base safety
 * rules every chat shares, plus helpers for the off-topic / off-photo
 * lines that mention the chat's specific job. Pulled out here so we
 * can tweak the rules in one spot.
 */

// Universal safety rules every scope inherits.
export const BASE_RULES = `
GENERAL RULES:
- Do NOT diagnose
- Do NOT replace medical advice
- Do NOT make up missing info
- If unsure, say so
- Keep responses simple and clear
`.trim();

// Off-topic guard for text input. Uses the scope's topic when one is provided.
export const buildRelevanceRule = (topic?: string) =>
  topic
    ? `- If the message is off-topic or not related to your purpose, respond with exactly: "Sorry, I think that's off-topic. I'm here to ${topic}."`
    : `- If the user asks something completely unrelated to your task, politely say so and briefly remind them what you are here to help with`;

// Off-photo guard. Looser than the text rule because photos are more ambiguous.
export const buildPhotoRelevanceRule = (topic?: string) =>
  topic
    ? `- Only reject the photo if it clearly shows something with NO possible connection to ${topic} — such as a selfie, a landscape, food, or a random object. If there is any doubt, try to help. If you do reject it, respond with exactly: "Sorry, this photo doesn't seem relevant. I'm here to ${topic}."`
    : `- Only reject the photo if it is clearly and obviously unrelated to your task`;
