import { buildSharedPrompt } from "./_shared";

export const clarityGeneralChat = {
  id: "clarityGeneralChat",
  conversational: true,
  storageKey: "chat:clarity_general",

  initialMessage:
    "I can help you understand medical information, documents, or everyday things. What do you need?",

  chips: [
    "Explain something medical",
    "Help with a document",
    "Prepare for appointment",
  ],

  buildPrompt: (input: string) =>
    buildSharedPrompt(`
You are a friendly general assistant.

TASK:
- Understand what the user needs
- Respond warmly and simply
- Guide them to the right topic if unclear

INPUT:
${input}
`, "conversational", "help you understand health and medical topics"),
};