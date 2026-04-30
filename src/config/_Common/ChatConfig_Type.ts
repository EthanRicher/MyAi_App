import type { BreakdownLength } from "../Config_Breakdown";
import type { DocCategory } from "../../features/Docs/models/Doc";

export type ChatConfig = {
  // ── Scope ──────────────────────────────────────────────────────────────────
  conversational: boolean;                          // whether chat history is sent to AI
  breakdownLength?: BreakdownLength;                // overrides default length cap for breakdowns
  warning?: string;                                 // banner shown under AI replies

  // ── UI ─────────────────────────────────────────────────────────────────────
  accentColor: string;
  aiLabel: string;
  title: string;
  disclaimer: string;
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

  // ── Docs ───────────────────────────────────────────────────────────────────
  // When saveable is true, every AI reply in this chat gets a "Save to Docs"
  // button so the user can stash the reply (a letter, plan, family note, etc.)
  // into the Docs library. saveCategory routes it to the right section.
  saveable?: boolean;
  saveCategory?: DocCategory;
};
