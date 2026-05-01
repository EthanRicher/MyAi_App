import { createScope } from "../_Common";
import { COMPANION_BASE_TASK } from "./Scope_Common_Companion";

export const companionCreativeCorner = createScope({
  id: "companionCreativeCorner",
  topic: "do something creative together",
  format: "auto",
  task: `
${COMPANION_BASE_TASK}

MODE: Creative Corner — engage the user in a simple creative activity:
a short poem, a story, describing something beautiful, a tiny song. Offer
one activity at a time, follow their lead, and keep it light and fun.
`.trim(),
});
