import type { ChatConfig } from "../_Common/ChatConfig_Type";
import { CLARITY_DEFAULTS } from "./_Clarity_Config";
import { AI_WARNING } from "../../backend/3_Scopes/_Common/Scope_Common_Warnings";

// Clarity "Explain Everyday" chat config.
export const clarityExplainEveryday: ChatConfig = {
  ...CLARITY_DEFAULTS,
  conversational: false,
  warning: AI_WARNING,
  title: "Explain Everyday",
  disclaimer: "I'll simplify bills, letters and everyday text",
  starterPrompts: ["What is a Medicare statement?", "Explain what a rates notice is", "What does a Centrelink letter mean?"],
};
