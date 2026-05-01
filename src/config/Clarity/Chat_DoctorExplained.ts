import type { ChatConfig } from "../_Common/ChatConfig_Type";
import { CLARITY_DEFAULTS } from "./_Clarity_Config";
import { MEDICAL_WARNING } from "../../backend/3_Scopes/_Common/Scope_Common_Warnings";

export const clarityDoctorExplained: ChatConfig = {
  ...CLARITY_DEFAULTS,
  conversational: true,
  warning: MEDICAL_WARNING,
  title: "Doctor Explained",
  disclaimer: "I'll explain what your doctor said simply",
  saveable: true,
  saveCategory: "doctor",
};
