import type { ChatConfig } from "../_Common/ChatConfig_Type";
import { COMPANION_DEFAULTS } from "./_Companion_Config";

// Companion "Calm Down" chat config.
export const companionCalmDown: ChatConfig = {
  ...COMPANION_DEFAULTS,
  title: "Calm Down",
  disclaimer: "Calming breathing and relaxation",
  starterPrompts: ["Guide me through deep breathing", "Help me relax right now", "I'm feeling anxious, can you help?"],
};
