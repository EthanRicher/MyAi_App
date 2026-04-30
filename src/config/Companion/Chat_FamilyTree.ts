import type { ChatConfig } from "../_Common/ChatConfig_Type";
import { COMPANION_DEFAULTS } from "./_Companion_Config";

export const companionFamilyTree: ChatConfig = {
  ...COMPANION_DEFAULTS,
  title: "Family Tree",
  disclaimer: "Let's talk about your family",
  starterPrompts: ["Help me remember my family history", "Let's talk about my grandchildren", "Tell me about keeping a family tree"],
  saveable: true,
  saveCategory: "family",
};
