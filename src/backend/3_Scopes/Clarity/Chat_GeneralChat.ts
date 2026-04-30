import { createScope, AI_WARNING } from "../_Common";

export const clarityGeneralChat = createScope({
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
});
