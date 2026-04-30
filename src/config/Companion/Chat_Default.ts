import type { ChatConfig } from "../_Common/ChatConfig_Type";
import { COMPANION_DEFAULTS } from "./_Companion_Config";

export const companionDefault: ChatConfig = {
  ...COMPANION_DEFAULTS,
  title: "Companion Chat",
  disclaimer: "I'm here to chat and keep you company",
};
