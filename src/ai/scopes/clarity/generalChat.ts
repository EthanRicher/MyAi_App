import { createScope, AI_WARNING } from "../_shared";

export const clarityGeneralChat = {
  ...createScope({
    id: "clarityGeneralChat",
    topic: "help you understand health and medical topics",
    warning: AI_WARNING,
    format: "auto",
    task: `
You are a friendly general assistant.

TASK:
- Understand what the user needs
- Respond warmly and simply
- Guide them to the right topic if unclear
`.trim(),
  }),
  conversational: true,
  storageKey: "chat:clarity_general",
  chips: ["Explain something medical", "Help with a document", "Prepare for appointment"],
};
