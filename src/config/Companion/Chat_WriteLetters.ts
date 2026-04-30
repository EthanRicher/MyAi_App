import type { ChatConfig } from "../_Common/ChatConfig_Type";
import { COMPANION_DEFAULTS } from "./_Companion_Config";

export const companionWriteLetters: ChatConfig = {
  ...COMPANION_DEFAULTS,
  title: "Write Letters",
  disclaimer: "I'll help you write a heartfelt letter",
  starterPrompts: ["Help me write a letter to a friend", "I want to write to my grandchildren", "Help me write a thank you note"],
  saveable: true,
  saveCategory: "letter",
};
