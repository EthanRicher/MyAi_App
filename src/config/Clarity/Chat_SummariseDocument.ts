import type { ChatConfig } from "../_Common/ChatConfig_Type";
import { CLARITY_DEFAULTS } from "./_Clarity_Config";
import { AI_WARNING } from "../../backend/3_Scopes/_Common/Scope_Common_Warnings";

// Clarity "Summarise Document" chat config. Speech disabled; saves the summary to Docs.
export const claritySummariseDocument: ChatConfig = {
  ...CLARITY_DEFAULTS,
  conversational: false,
  warning: AI_WARNING,
  title: "Summarise Document",
  disclaimer: "I'll summarise your document plainly",
  speechEnabled: false,
  saveable: true,
  saveCategory: "summary",
};
