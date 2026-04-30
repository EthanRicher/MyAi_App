import type { ChatConfig } from "../_Common/ChatConfig_Type";
import { COMPANION_DEFAULTS } from "./_Companion_Config";

export const companionPlanMyDay: ChatConfig = {
  ...COMPANION_DEFAULTS,
  title: "Plan My Day",
  disclaimer: "Let's plan a simple, balanced day",
  starterPrompts: ["Help me plan a nice day", "What's a good morning routine?", "Plan a relaxing afternoon for me"],
  saveable: true,
  saveCategory: "plan",
};
