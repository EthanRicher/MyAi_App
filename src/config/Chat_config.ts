// ─── Central Chat Configuration ───────────────────────────────────────────────
// Every chat in the app is configured here. Tweak UI, scope behaviour,
// history settings, format, copy, and warnings all from this single file.

import type { ScopeId } from "../ai/scopes";
import { MEDICAL_WARNING, AI_WARNING } from "../ai/scopes/_shared/warnings";
import type { BreakdownLength } from "./Breakdown_config";
import { colors } from "../theme";

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
  title: string;
  disclaimer: string;
  disclaimerSub: string;
  backTo: string;
  backLabel: string;
  speechEnabled: boolean;
  cameraEnabled: boolean;
  starterPrompts?: string[]; // shown as chips when chat is empty

  // ── Copy ───────────────────────────────────────────────────────────────────
  placeholder: string;        // input field placeholder
  typingLabel: string;        // shown while AI is responding
  errorMessage: string;       // shown when AI call fails
  fallbackMessage: string;    // shown when AI returns no text
  speechErrorMessage: string; // shown when speech transcription fails
};

// ─── Shared Defaults ──────────────────────────────────────────────────────────
// Common copy/behaviour shared across chats. Spread into each config and
// override only the fields that differ.

const CLARITY_DEFAULTS = {
  format: "auto" as const,
  saveHistory: true,
  clearOnExit: false,
  accentColor: colors.primary,
  aiLabel: "Clarity AI",
  backTo: "Clarity",
  backLabel: "Clarity",
  disclaimerSub: "Always confirm with your doctor before acting on anything here.",
  speechEnabled: true,
  cameraEnabled: true,
  placeholder: "Type your message...",
  typingLabel: "Typing...",
  errorMessage: "Sorry, I couldn't get a response. Please try again.",
  fallbackMessage: "No response",
  speechErrorMessage: "I couldn't hear you. Please try again.",
};

// ─── Clarity Chats ────────────────────────────────────────────────────────────

export const clarityChatConfigs: Record<string, ChatConfig> = {
  clarityGeneralChat: {
    ...CLARITY_DEFAULTS,
    scopeId: "clarityGeneralChat",
    conversational: true,
    warning: AI_WARNING,
    title: "Clarity Chat",
    disclaimer: "I'll help you understand health topics",
    starterPrompts: ["What is high blood pressure?", "Explain what a CT scan is", "What does cholesterol mean?"],
  },
  clarityDoctorExplained: {
    ...CLARITY_DEFAULTS,
    scopeId: "clarityDoctorExplained",
    conversational: true,
    warning: MEDICAL_WARNING,
    title: "Doctor Explained",
    disclaimer: "I'll explain what your doctor said simply",
  },
  clarityExplainMedication: {
    ...CLARITY_DEFAULTS,
    scopeId: "clarityExplainMedication",
    conversational: false,
    warning: MEDICAL_WARNING,
    title: "Explain Medication",
    disclaimer: "I'll explain your medication simply",
    starterPrompts: ["What is paracetamol used for?", "Explain ibuprofen side effects", "What is metformin?"],
  },
  clarityExplainEveryday: {
    ...CLARITY_DEFAULTS,
    scopeId: "clarityExplainEveryday",
    conversational: false,
    warning: AI_WARNING,
    title: "Explain Everyday",
    disclaimer: "I'll simplify bills, letters and everyday text",
    starterPrompts: ["What is a Medicare statement?", "Explain what a rates notice is", "What does a Centrelink letter mean?"],
  },
  clarityAppointmentPrep: {
    ...CLARITY_DEFAULTS,
    scopeId: "clarityAppointmentPrep",
    conversational: true,
    warning: MEDICAL_WARNING,
    title: "Appointment Prep",
    disclaimer: "I'll help you prep for your appointment",
    cameraEnabled: false,
    starterPrompts: ["Help me prepare questions for my GP", "What should I ask about my blood test?", "I have a specialist appointment tomorrow"],
  },
  claritySummariseDocument: {
    ...CLARITY_DEFAULTS,
    scopeId: "claritySummariseDocument",
    format: "breakdown",
    conversational: false,
    warning: AI_WARNING,
    saveHistory: false,
    clearOnExit: true,
    title: "Summarise Document",
    disclaimer: "I'll summarise your document plainly",
    speechEnabled: false,
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
  accentColor: colors.green,
  aiLabel: "MedView AI",
  title: "MedView Chat",
  disclaimer: "I'm here to explain your medication",
  disclaimerSub: "This is not medical advice. Always confirm with your doctor.",
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

// ─── Companion Chats ──────────────────────────────────────────────────────────
// Companion uses one config per "mode" (Brain Games, Plan My Day, etc.) so it
// shares the same shape as Clarity. The "default" entry is used when no mode
// is selected.

const COMPANION_DEFAULTS = {
  scopeId: "companionChat" as ScopeId,
  format: "auto" as const,
  conversational: true,
  warning: undefined, // no warning — companion is not informational
  saveHistory: true,
  clearOnExit: false,
  accentColor: colors.purple,
  aiLabel: "Companion AI",
  backTo: "Companion",
  backLabel: "Companion",
  disclaimerSub: "I'm an AI companion — for urgent concerns please speak to someone you trust.",
  speechEnabled: true,
  cameraEnabled: false,
  placeholder: "Tell me what's on your mind...",
  typingLabel: "Thinking...",
  errorMessage: "I'm sorry, I didn't quite catch that. Could you try again?",
  fallbackMessage: "I'm here — please tell me more.",
  speechErrorMessage: "I couldn't hear you. Could you say it again?",
};

export const companionChatConfigs: Record<string, ChatConfig> = {
  default: {
    ...COMPANION_DEFAULTS,
    title: "Companion Chat",
    disclaimer: "I'm here to chat and keep you company",
  },
  "Brain Games": {
    ...COMPANION_DEFAULTS,
    title: "Brain Games",
    disclaimer: "Trivia, puzzles and brain teasers",
    starterPrompts: ["Ask me some trivia", "Give me a brain teaser", "Let's do a word puzzle"],
  },
  "Plan My Day": {
    ...COMPANION_DEFAULTS,
    title: "Plan My Day",
    disclaimer: "Let's plan a simple, balanced day",
    starterPrompts: ["Help me plan a nice day", "What's a good morning routine?", "Plan a relaxing afternoon for me"],
  },
  "Calm Down": {
    ...COMPANION_DEFAULTS,
    title: "Calm Down",
    disclaimer: "Calming breathing and relaxation",
    starterPrompts: ["Guide me through deep breathing", "Help me relax right now", "I'm feeling anxious, can you help?"],
  },
  "Ask Anything": {
    ...COMPANION_DEFAULTS,
    title: "Ask Anything",
    disclaimer: "Ask me anything — tech, cooking, emails",
    starterPrompts: ["What's a good recipe for soup?", "How do I write a good email?", "Explain how Wi-Fi works"],
  },
  "Share Stories": {
    ...COMPANION_DEFAULTS,
    title: "Share Stories",
    disclaimer: "I'd love to hear your stories",
    starterPrompts: ["Tell me an interesting story", "I'd love to share a memory", "What's a good topic to chat about?"],
  },
  "Family Tree": {
    ...COMPANION_DEFAULTS,
    title: "Family Tree",
    disclaimer: "Let's talk about your family",
    starterPrompts: ["Help me remember my family history", "Let's talk about my grandchildren", "Tell me about keeping a family tree"],
  },
  "Write Letters": {
    ...COMPANION_DEFAULTS,
    title: "Write Letters",
    disclaimer: "I'll help you write a heartfelt letter",
    starterPrompts: ["Help me write a letter to a friend", "I want to write to my grandchildren", "Help me write a thank you note"],
  },
  "Memory Book": {
    ...COMPANION_DEFAULTS,
    title: "Memory Book",
    disclaimer: "Let's cherish your favourite memories",
    starterPrompts: ["Help me document a favourite memory", "Let's talk about a special moment", "I want to remember a cherished day"],
  },
  "Creative Corner": {
    ...COMPANION_DEFAULTS,
    title: "Creative Corner",
    disclaimer: "Poems, stories and creative activities",
    starterPrompts: ["Write me a short poem", "Let's make up a short story", "Give me a fun creative activity"],
  },
};

export const getCompanionChatConfig = (mode?: string): ChatConfig =>
  (mode && companionChatConfigs[mode]) || companionChatConfigs.default;
