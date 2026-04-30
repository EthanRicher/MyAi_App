import type { ChatConfig } from "../_Common/ChatConfig_Type";
import { CLARITY_DEFAULTS } from "./_Clarity_Config";
import { AI_WARNING } from "../../backend/3_Scopes/_Common/Scope_Common_Warnings";

export const clarityGeneralChat: ChatConfig = {
  ...CLARITY_DEFAULTS,
  conversational: true,
  warning: AI_WARNING,
  title: "Clarity Chat",
  disclaimer: "I'll help you understand health topics",
  starterPrompts: ["What is high blood pressure?", "Explain what a CT scan is", "What does cholesterol mean?"],
};
