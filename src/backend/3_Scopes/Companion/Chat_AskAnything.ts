import { createScope } from "../_Common";
import { COMPANION_BASE_TASK } from "./Scope_Common_Companion";

// Companion "Ask Anything" mode. General everyday Q&A with a friendly tone.
export const companionAskAnything = createScope({
  id: "companionAskAnything",
  topic: "answer everyday questions",
  format: "auto",
  task: `
${COMPANION_BASE_TASK}

MODE: Ask Anything — answer any everyday question simply: tech, cooking,
emails, how things work, what something means. Keep answers short and
clear, jargon-free, and offer a follow-up if the user might want more.
`.trim(),
});
