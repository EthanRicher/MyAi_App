import type { ChatConfig } from "../_Common/ChatConfig_Type";
import { COMPANION_DEFAULTS } from "./_Companion_Config";

// Companion "Creative Corner" chat config.
export const companionCreativeCorner: ChatConfig = {
  ...COMPANION_DEFAULTS,
  title: "Creative Corner",
  disclaimer: "Poems, stories and creative activities",
  starterPrompts: ["Write me a short poem", "Let's make up a short story", "Give me a fun creative activity"],
};
