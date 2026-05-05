import type { ChatConfig } from "../_Common/ChatConfig_Type";
import { MEDICAL_WARNING } from "../../backend/3_Scopes/_Common/Scope_Common_Warnings";
import { colors } from "../../theme";

// MedView chat config. Drives the chat UI when the user taps "Talk about this medication".
export const medviewChatConfig: ChatConfig = {
  conversational: true,
  warning: MEDICAL_WARNING,
  accentColor: colors.green,
  aiLabel: "MedView AI",
  title: "MedView Chat",
  disclaimer: "I'm here to explain your medication",
  backTo: "MedView",
  backLabel: "MedView",
  speechEnabled: true,
  cameraEnabled: true,
  placeholder: "Ask about your medication...",
  typingLabel: "Typing...",
  errorMessage: "Sorry, I couldn't get a response. Please try again.",
  fallbackMessage: "No response",
  speechErrorMessage: "I couldn't hear you. Please try again.",
};
