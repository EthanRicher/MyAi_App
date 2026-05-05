import type { ChatConfig } from "../_Common/ChatConfig_Type";
import { COMPANION_DEFAULTS } from "./_Companion_Config";

// Companion "Share Stories" chat config.
export const companionShareStories: ChatConfig = {
  ...COMPANION_DEFAULTS,
  title: "Share Stories",
  disclaimer: "I'd love to hear your stories",
  starterPrompts: ["Tell me an interesting story", "I'd love to share a memory", "What's a good topic to chat about?"],
};
