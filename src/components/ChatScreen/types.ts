import type { DocCategory } from "../../features/Docs/models/Doc";
import type { CameraInputResult } from "../../backend/1_Input/Camera/Camera_Types";
import type { ChatMessage, ProcessResult } from "../../backend/_AI/AI_ChatTypes";
import type { WhisperResult } from "../../backend/1_Input/Speech/Input_Whisper";

export type { CameraInputResult, ChatMessage, ProcessResult };

/**
 * Chat-screen-only types. The pipeline-shared shapes (ChatMessage,
 * ProcessResult, CameraInputResult) live in the backend and are
 * re-exported above so existing UI consumers keep working through
 * this barrel.
 */

// What the chat sends down to the AI on each turn.
export interface ChatSendPayload {
  text?: string;       // Plain text the user typed or said.
  imageUri?: string;   // Attached photo, if any.
  hiddenText?: boolean;// Send text to the AI without showing it in the user bubble (e.g. OCR).
}

// Full prop list for the ChatScreen component.
export interface ChatScreenProps {
  accentColor: string;                                 // Theme colour used across the chat surface.
  aiLabel?: string;                                    // Name shown above each AI bubble.
  storageKey: string;                                  // AsyncStorage key for persisting the transcript.
  initialMessages?: ChatMessage[];                     // Bubbles to seed the chat with on first load.
  onProcessMessage: (message: ChatSendPayload, history: ChatMessage[]) => Promise<ProcessResult>; // The AI turn handler.
  disclaimer?: string;                                 // Banner shown under the back button.
  backTo?: string;                                     // Route the back button should jump to.
  backLabel?: string;                                  // Custom back button label.
  onTranscribeAudio?: (uri: string) => Promise<WhisperResult>; // Override the default Whisper transcriber.
  onCameraPress?: (onImageReady: (imageUri: string) => void) => Promise<CameraInputResult | null>; // Camera handler.
  placeholder?: string;                                // Placeholder text in the typing input.
  typingLabel?: string;                                // Text shown in the typing placeholder bubble.
  speechErrorMessage?: string;                         // Message shown when speech transcription fails.
  autoPrompt?: string;                                 // Prompt fired automatically once the chat loads.
  messageWarning?: string;                             // Scope-specific warning copy for AI replies.
  clearOnLoad?: boolean;                               // Wipe the saved transcript when the screen opens.
  starterPrompts?: string[];                           // Suggestion chips shown when the chat is empty.
  conversational?: boolean;                            // Pair user + AI bubbles in the reader modal.
  saveable?: boolean;                                  // Enable the Save to Docs flow for this chat.
  saveCategory?: DocCategory;                          // Docs category to save into.
}
