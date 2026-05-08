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
// IMPORTANT: judges relevance in CONTEXT — a short answer to a question YOU just asked
// is always on-topic, even if the answer alone (e.g. "the Crown and Anchor", "yes",
// "Bristol") looks unrelated to the topic when read in isolation.
export const buildRelevanceRule = (topic?: string) =>
  topic
    ? `- Only deflect when the user CLEARLY changes the subject to something with no connection to ${topic}. Read the conversation history first: if the user is answering a question you just asked, or expanding on something you raised, that is ON-TOPIC even when the message alone (a place, a name, a "yes", a hobby) sounds unrelated. When in doubt, stay engaged. If you do deflect, respond with exactly: "Sorry, I think that's off-topic. I'm here to ${topic}."`
    : `- If the user asks something completely unrelated to your task, politely say so and briefly remind them what you are here to help with. Don't deflect on a short answer to your own question.`;

// Off-photo guard. Looser than the text rule because photos are more ambiguous.
export const buildPhotoRelevanceRule = (topic?: string) =>
  topic
    ? `- Only reject the photo if it clearly shows something with NO possible connection to ${topic} — such as a selfie, a landscape, food, or a random object. If there is any doubt, try to help. If you do reject it, respond with exactly: "Sorry, this photo doesn't seem relevant. I'm here to ${topic}."`
    : `- Only reject the photo if it is clearly and obviously unrelated to your task`;
