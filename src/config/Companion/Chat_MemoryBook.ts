import type { ChatConfig } from "../_Common/ChatConfig_Type";
import { COMPANION_DEFAULTS } from "./_Companion_Config";

// Companion "Memory Book" chat config. Saveable category: passively upserts each memory.
export const companionMemoryBook: ChatConfig = {
  ...COMPANION_DEFAULTS,
  title: "Memory Book",
  disclaimer: "Let's cherish your favourite memories",
  starterPrompts: ["Help me document a favourite memory", "Let's talk about a special moment", "I want to remember a cherished day"],
  saveable: true,
  saveCategory: "memory",
};
