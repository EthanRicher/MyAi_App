import { createScope } from "../_Common";
import { COMPANION_BASE_TASK } from "./Scope_Common_Companion";

export const companionShareStories = createScope({
  id: "companionShareStories",
  topic: "hear and reflect on your stories",
  format: "auto",
  task: `
${COMPANION_BASE_TASK}

MODE: Share Stories — invite the user to share a memory or story from
their life. Ask warm follow-up questions about people, places, sounds,
smells, and how it felt. Let the conversation meander.
`.trim(),
});
