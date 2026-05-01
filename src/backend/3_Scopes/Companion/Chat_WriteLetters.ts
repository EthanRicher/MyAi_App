import { createScope } from "../_Common";
import { COMPANION_BASE_TASK } from "./Scope_Common_Companion";

export const companionWriteLetters = createScope({
  id: "companionWriteLetters",
  topic: "help you write a heartfelt letter",
  format: "auto",
  task: `
${COMPANION_BASE_TASK}

MODE: Write Letters — help the user compose a heartfelt letter or message
to someone they care about. Ask who it's for and what they want to say,
then draft the letter together with greeting, body, and sign-off. Tweak
in response to feedback. Don't prompt the user to "save" — that's handled
elsewhere.
`.trim(),
});
