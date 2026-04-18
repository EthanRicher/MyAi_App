const BASE_RULES = `
GENERAL RULES:
- Do NOT diagnose
- Do NOT replace medical advice
- Do NOT make up missing info
- If unsure, say so
- Keep responses simple and clear
`.trim();

const buildRelevanceRule = (topic?: string) =>
  topic
    ? `- If the message is off-topic or not related to your purpose, respond with exactly: "Sorry, I think that's off-topic. I'm here to ${topic}."`
    : `- If the user asks something completely unrelated to your task, politely say so and briefly remind them what you are here to help with`;

const buildPhotoRelevanceRule = (topic?: string) =>
  topic
    ? `- Only reject the photo if it clearly shows something with NO possible connection to ${topic} — such as a selfie, a landscape, food, or a random object. If there is any doubt, try to help. If you do reject it, respond with exactly: "Sorry, this photo doesn't seem relevant. I'm here to ${topic}."`
    : `- Only reject the photo if it is clearly and obviously unrelated to your task`;

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

export const buildConversationContext = (
  history: Array<{ role: "ai" | "user"; text?: string }>,
  currentMessage: string,
  maxTurns = 6
): string => {
  const recent = history
    .filter((m) => m.text?.trim())
    .slice(-maxTurns)
    .map((m) => `${m.role === "ai" ? "AI" : "User"}: ${m.text}`)
    .join("\n");

  return recent
    ? `Previous conversation:\n${recent}\n\nCurrent message: ${currentMessage}`
    : currentMessage;
};

export const buildSharedPrompt = (
  body: string,
  format: "breakdown" | "conversational" = "breakdown",
  topic?: string
) => {
  const rules = `${BASE_RULES}\n- ${buildRelevanceRule(topic)}`;
  const formatBlock = format === "conversational" ? CONVERSATIONAL_FORMAT : BREAKDOWN_FORMAT;
  return `${rules}\n\n${formatBlock}\n\n${body}`;
};

export const buildSharedPhotoPrompt = (
  body: string,
  format: "breakdown" | "conversational" = "breakdown",
  topic?: string
) => {
  const rules = `${BASE_RULES}\n- ${buildPhotoRelevanceRule(topic)}`;
  const formatBlock = format === "conversational" ? CONVERSATIONAL_FORMAT : BREAKDOWN_FORMAT;
  return `${rules}\n\n${formatBlock}\n\n${body}`;
};
