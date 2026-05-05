/**
 * Builds the "previous conversation + current message" block that
 * conversational chats prepend to their AI prompt. Keeps the last
 * few turns so the AI has context, without dumping the whole
 * transcript on every call.
 */
export const buildConversationContext = (
  history: Array<{ role: "ai" | "user"; text?: string }>,
  currentMessage: string,
  maxTurns = 6
): string => {
  // Take the last N turns that actually have text, format them as a transcript.
  const recent = history
    .filter((m) => m.text?.trim())
    .slice(-maxTurns)
    .map((m) => `${m.role === "ai" ? "AI" : "User"}: ${m.text}`)
    .join("\n");

  return recent
    ? `Previous conversation:\n${recent}\n\nCurrent message: ${currentMessage}`
    : currentMessage;
};
