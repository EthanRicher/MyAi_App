import type { ChatConfig } from "../_Common/ChatConfig_Type";
import { CLARITY_DEFAULTS } from "./_Clarity_Config";
import { MEDICAL_WARNING } from "../../backend/3_Scopes/_Common/Scope_Common_Warnings";

export const clarityExplainMedication: ChatConfig = {
  ...CLARITY_DEFAULTS,
  conversational: false,
  warning: MEDICAL_WARNING,
  title: "Explain Medication",
  disclaimer: "I'll explain your medication simply",
  starterPrompts: ["What is paracetamol used for?", "Explain ibuprofen side effects", "What is metformin?"],
};
