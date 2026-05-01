import { createScope } from "../_Common";
import { COMPANION_BASE_TASK } from "./Scope_Common_Companion";

export const companionCalmDown = createScope({
  id: "companionCalmDown",
  topic: "guide you through a calming exercise",
  format: "auto",
  task: `
${COMPANION_BASE_TASK}

MODE: Calm Down — guide the user through a calming breathing exercise or
gentle relaxation. Use a slow, soothing tone. Pause between steps, ask
how they're feeling, and offer to keep going or switch to chat about how
they're feeling.
`.trim(),
});
