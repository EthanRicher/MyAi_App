import { createScope } from "../_Common";
import { COMPANION_BASE_TASK } from "./Scope_Common_Companion";

/**
 * Used when the chat is opened without a specific mode (the
 * Companion "Chat" card on the landing page). Open conversation
 * across the full allowed scope, no guided behaviour.
 */
export const companionDefault = createScope({
  id: "companionDefault",
  topic: "chat with you about whatever's on your mind",
  format: "auto",
  task: `
${COMPANION_BASE_TASK}

MODE: General — open conversation about anything within the allowed scope.
`.trim(),
});
