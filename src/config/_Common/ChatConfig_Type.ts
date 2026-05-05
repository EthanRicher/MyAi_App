import type { BreakdownLength } from "../Config_General";
import type { DocCategory } from "../../features/Docs/models/Doc";

/**
 * Shared shape for every chat config (Companion, Clarity, MedView,
 * etc.). Each feature's config file exports one of these and the
 * chat screen feeds it into ChatScreen + the runChatTurn helper.
 */
export type ChatConfig = {
  // Scope.
  conversational: boolean;            // True to feed prior chat history into the AI.
  breakdownLength?: BreakdownLength;  // Overrides the default length cap for breakdowns.
  warning?: string;                   // Banner pinned to AI replies.

  // UI.
  accentColor: string;                // Theme tint for this chat.
  aiLabel: string;                    // Name shown above each AI bubble.
  title: string;                      // Chat title.
  disclaimer: string;                 // Top disclaimer banner copy.
  backTo: string;                     // Route to jump to when the back button is pressed.
  backLabel: string;                  // Label shown on the back button.
  speechEnabled: boolean;             // Show the mic / record button.
  cameraEnabled: boolean;             // Show the photo button.
  starterPrompts?: string[];          // Suggestion chips shown when the chat is empty.

  // Copy.
  placeholder: string;                // Text input placeholder.
  typingLabel: string;                // Text shown in the typing-bubble while waiting on the AI.
  errorMessage: string;               // Shown when the AI call fails.
  fallbackMessage: string;            // Shown when the AI returns no text.
  speechErrorMessage: string;         // Shown when speech transcription fails.

  /**
   * Docs save flow. When saveable is true, the chat may produce a
   * "Save to Docs" card after a save-worthy reply. saveCategory
   * routes the saved doc to the right section.
   */
  saveable?: boolean;
  saveCategory?: DocCategory;
};
