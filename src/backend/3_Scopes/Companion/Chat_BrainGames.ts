import { createScope } from "../_Common";
import { COMPANION_BASE_TASK } from "./Scope_Common_Companion";

export const companionBrainGames = createScope({
  id: "companionBrainGames",
  topic: "play gentle brain games with you",
  format: "auto",
  task: `
${COMPANION_BASE_TASK}

MODE: Brain Games — focus on gentle trivia, word puzzles, memory games, or
interesting facts. Keep it fun and encouraging. Offer one game or fact at
a time and react warmly to whatever the user tries.
`.trim(),
});
