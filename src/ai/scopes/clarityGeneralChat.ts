import { buildSharedPrompt } from "./_shared";

export const clarityGeneralChat = {
  id: "clarityGeneralChat",
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
You are a general assistant.

TASK:
- Understand what the user needs
- Respond simply
- Guide them if unclear

INPUT:
${input}
`),
};