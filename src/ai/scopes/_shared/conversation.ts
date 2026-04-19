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
