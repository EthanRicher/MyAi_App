// ─── Central Chat Configuration ───────────────────────────────────────────────
// Every chat in the app is configured here. Tweak UI, scope behaviour,
// history settings, format, and warnings all from this single file.

import type { ScopeId } from "../ai/scopes";
import { MEDICAL_WARNING, AI_WARNING } from "../ai/scopes/_shared/warnings";

export type ChatConfig = {
  // ── Scope ──────────────────────────────────────────────────────────────────
  scopeId: ScopeId;
  format: "breakdown" | "conversational" | "auto"; // how the AI structures replies
  conversational: boolean;                          // whether chat history is sent to AI
  warning?: string;                                 // banner shown under AI replies

  // ── History ────────────────────────────────────────────────────────────────
  saveHistory: boolean;   // persist messages between sessions
  clearOnExit: boolean;   // wipe chat when user leaves the screen

  // ── UI ─────────────────────────────────────────────────────────────────────
  accentColor: string;
  aiLabel: string;
  disclaimer: string;
  backTo: string;
  backLabel: string;
  speechEnabled: boolean;
  cameraEnabled: boolean;
};

// ─── Clarity Chats ────────────────────────────────────────────────────────────

export const clarityChatConfigs: Record<string, ChatConfig> = {
  clarityGeneralChat: {
    scopeId: "clarityGeneralChat",
    format: "auto",
    conversational: true,
    warning: AI_WARNING,
    saveHistory: true,
    clearOnExit: false,
    accentColor: "#0dd9f7",
    aiLabel: "Clarity AI",
    disclaimer: "I'll help you understand health topics",
    backTo: "Clarity",
    backLabel: "Clarity",
    speechEnabled: true,
    cameraEnabled: true,
  },
  clarityDoctorExplained: {
    scopeId: "clarityDoctorExplained",
    format: "auto",
    conversational: true,
    warning: MEDICAL_WARNING,
    saveHistory: true,
    clearOnExit: false,
    accentColor: "#0dd9f7",
    aiLabel: "Clarity AI",
    disclaimer: "I'll explain what your doctor said simply",
    backTo: "Clarity",
    backLabel: "Clarity",
    speechEnabled: true,
    cameraEnabled: true,
  },
  clarityExplainMedication: {
    scopeId: "clarityExplainMedication",
    format: "auto",
    conversational: false,
    warning: MEDICAL_WARNING,
    saveHistory: true,
    clearOnExit: false,
    accentColor: "#0dd9f7",
    aiLabel: "Clarity AI",
    disclaimer: "I'll explain your medication simply",
    backTo: "Clarity",
    backLabel: "Clarity",
    speechEnabled: true,
    cameraEnabled: true,
  },
  clarityExplainEveryday: {
    scopeId: "clarityExplainEveryday",
    format: "auto",
    conversational: false,
    warning: AI_WARNING,
    saveHistory: true,
    clearOnExit: false,
    accentColor: "#0dd9f7",
    aiLabel: "Clarity AI",
    disclaimer: "I'll simplify bills, letters and everyday text",
    backTo: "Clarity",
    backLabel: "Clarity",
    speechEnabled: true,
    cameraEnabled: true,
  },
  clarityAppointmentPrep: {
    scopeId: "clarityAppointmentPrep",
    format: "auto",
    conversational: true,
    warning: MEDICAL_WARNING,
    saveHistory: true,
    clearOnExit: false,
    accentColor: "#0dd9f7",
    aiLabel: "Clarity AI",
    disclaimer: "I'll help you prep for your appointment",
    backTo: "Clarity",
    backLabel: "Clarity",
    speechEnabled: true,
    cameraEnabled: false,
  },
  claritySummariseDocument: {
    scopeId: "claritySummariseDocument",
    format: "breakdown",
    conversational: false,
    warning: AI_WARNING,
    saveHistory: false,
    clearOnExit: true,
    accentColor: "#0dd9f7",
    aiLabel: "Clarity AI",
    disclaimer: "I'll summarise your document plainly",
    backTo: "Clarity",
    backLabel: "Clarity",
    speechEnabled: false,
    cameraEnabled: true,
  },
};

// ─── MedView Chats ────────────────────────────────────────────────────────────

export const medviewChatConfig: ChatConfig = {
  scopeId: "medviewMedicationChat",
  format: "auto",
  conversational: true,
  warning: MEDICAL_WARNING,
  saveHistory: true,
  clearOnExit: false,
  accentColor: "#4CAF50",
  aiLabel: "MedView AI",
  disclaimer: "I'm here to explain your medication",
  backTo: "MedView",
  backLabel: "MedView",
  speechEnabled: true,
  cameraEnabled: true,
};

// ─── Companion Chats ──────────────────────────────────────────────────────────

export const companionChatConfig = {
  scopeId: "companionChat" as ScopeId,
  format: "auto" as const,
  conversational: true,
  warning: undefined,     // no warning — companion is not informational
  saveHistory: true,
  clearOnExit: false,
  accentColor: "#BB86FC",
  aiLabel: "Companion AI",
  defaultDisclaimer: "I'm here to chat and keep you company",
  backTo: "Companion",
  backLabel: "Companion",
  speechEnabled: true,
  cameraEnabled: false,

  modeDisclaimers: {
    "Brain Games":     "Trivia, puzzles and brain teasers",
    "Plan My Day":     "Let's plan a simple, balanced day",
    "Calm Down":       "Calming breathing and relaxation",
    "Ask Anything":    "Ask me anything — tech, cooking, emails",
    "Share Stories":   "I'd love to hear your stories",
    "Family Tree":     "Let's talk about your family",
    "Write Letters":   "I'll help you write a heartfelt letter",
    "Memory Book":     "Let's cherish your favourite memories",
    "Creative Corner": "Poems, stories and creative activities",
  } as Record<string, string>,
};
