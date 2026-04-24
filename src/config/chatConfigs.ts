// ─── Central Chat Configuration ───────────────────────────────────────────────
// Every chat in the app is configured here. Tweak UI, scope behaviour,
// history settings, format, and warnings all from this single file.

import type { ScopeId } from "../ai/scopes";
import { MEDICAL_WARNING, AI_WARNING } from "../ai/scopes/_shared/warnings";
import type { BreakdownLength } from "./breakdownSettings";

export type ChatConfig = {
  // ── Scope ──────────────────────────────────────────────────────────────────
  scopeId: ScopeId;
  format: "breakdown" | "conversational" | "auto"; // how the AI structures replies
  conversational: boolean;                          // whether chat history is sent to AI
  breakdownLength?: BreakdownLength;                // overrides default length cap for breakdowns
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
  starterPrompts?: string[]; // shown as chips when chat is empty
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
    starterPrompts: ["What is high blood pressure?", "Explain what a CT scan is", "What does cholesterol mean?"],
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
    starterPrompts: ["What is paracetamol used for?", "Explain ibuprofen side effects", "What is metformin?"],
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
    starterPrompts: ["What is a Medicare statement?", "Explain what a rates notice is", "What does a Centrelink letter mean?"],
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
    starterPrompts: ["Help me prepare questions for my GP", "What should I ask about my blood test?", "I have a specialist appointment tomorrow"],
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
  breakdownLength: undefined as BreakdownLength | undefined, // leave undefined to use DEFAULT_BREAKDOWN_LENGTH
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

  modeStarterPrompts: {
    "Brain Games":     ["Ask me some trivia", "Give me a brain teaser", "Let's do a word puzzle"],
    "Plan My Day":     ["Help me plan a nice day", "What's a good morning routine?", "Plan a relaxing afternoon for me"],
    "Calm Down":       ["Guide me through deep breathing", "Help me relax right now", "I'm feeling anxious, can you help?"],
    "Ask Anything":    ["What's a good recipe for soup?", "How do I write a good email?", "Explain how Wi-Fi works"],
    "Share Stories":   ["Tell me an interesting story", "I'd love to share a memory", "What's a good topic to chat about?"],
    "Family Tree":     ["Help me remember my family history", "Let's talk about my grandchildren", "Tell me about keeping a family tree"],
    "Write Letters":   ["Help me write a letter to a friend", "I want to write to my grandchildren", "Help me write a thank you note"],
    "Memory Book":     ["Help me document a favourite memory", "Let's talk about a special moment", "I want to remember a cherished day"],
    "Creative Corner": ["Write me a short poem", "Let's make up a short story", "Give me a fun creative activity"],
  } as Record<string, string[]>,
};
