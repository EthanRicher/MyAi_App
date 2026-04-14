const SHARED_RULES = `
GENERAL RULES:
- Do NOT diagnose
- Do NOT replace medical advice
- Do NOT make up missing info
- If unsure, say so
- Keep responses simple and clear
- If the user asks something completely unrelated to your task, politely say so and briefly remind them what you are here to help with
`.trim();

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

export const buildSharedPrompt = (body: string, format: "breakdown" | "conversational" = "breakdown") => {
  const formatBlock = format === "conversational" ? CONVERSATIONAL_FORMAT : BREAKDOWN_FORMAT;
  return `${SHARED_RULES}\n\n${formatBlock}\n\n${body}`;
};
