import type { ChatConfig } from "../_Common/ChatConfig_Type";
import { CLARITY_DEFAULTS } from "./_Clarity_Config";
import { MEDICAL_WARNING } from "../../backend/3_Scopes/_Common/Scope_Common_Warnings";

export const clarityAppointmentPrep: ChatConfig = {
  ...CLARITY_DEFAULTS,
  conversational: true,
  warning: MEDICAL_WARNING,
  title: "Appointment Prep",
  disclaimer: "I'll help you prep for your appointment",
  cameraEnabled: false,
  starterPrompts: ["Help me prepare questions for my GP", "What should I ask about my blood test?", "I have a specialist appointment tomorrow"],
};
