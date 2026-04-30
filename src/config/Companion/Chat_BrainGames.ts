import type { ChatConfig } from "../_Common/ChatConfig_Type";
import { COMPANION_DEFAULTS } from "./_Companion_Config";

export const companionBrainGames: ChatConfig = {
  ...COMPANION_DEFAULTS,
  title: "Brain Games",
  disclaimer: "Trivia, puzzles and brain teasers",
  starterPrompts: ["Ask me some trivia", "Give me a brain teaser", "Let's do a word puzzle"],
};
