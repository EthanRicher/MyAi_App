import type { DocCategory } from "../../features/Docs/models/Doc";

/**
 * Shared chat types. The message shape, what gets sent to the AI,
 * what comes back, and the camera hand-off. Lives on its own so any
 * file that just needs the data shapes can grab them without pulling
 * in React.
 */

// One bubble in the chat, either from the AI or the user.
export interface ChatMessage {
  role: "ai" | "user";       // Who sent this message.
  text?: string;             // The text body of the bubble.
  imageUri?: string;         // Local URI for an attached photo.
  isError?: boolean;         // Renders the bubble as an error.
  warningText?: string;      // Disclaimer banner pinned to the bottom of the bubble.
  timestamp?: string;        // Short HH:MM time stamp shown in the header row.
  isTranslation?: boolean;   // This bubble is the English translation of the previous one.
  aiFlagged?: boolean;       // Soft orange flag from the AI second-pass safety check.
  saveOffer?: { title: string; content: string; sentence: string }; // Marks this bubble as the "tap to save" card.
}

// What the chat sends down to the AI on each turn.
export interface ChatSendPayload {
  text?: string;       // Plain text the user typed or said.
  imageUri?: string;   // Attached photo, if any.
  hiddenText?: boolean;// Send text to the AI without showing it in the user bubble (e.g. OCR).
}

export interface CameraInputResult {
  imageUri: string; // Local URI for the captured photo.
  text: string;     // Any OCR / accompanying text picked up with the photo.
}

// What the AI hands back for one turn.
export interface ProcessResult {
  aiText: string;        // The assistant's reply text.
  isError?: boolean;     // True when the turn failed (network, AI error, etc.).
  saveOffer?: {
    suggestedTitle: string;       // Title to pre-fill in the save modal.
    cleanContent: string;         // Body content to save into Docs.
    offerSentence?: string;       // Show the offer as its own bubble with a Tap to Save button.
    autoSave?: boolean;           // Passive categories (Family, Memory) save quietly in the background.
  };
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
  onTranscribeAudio?: (uri: string) => Promise<string>;// Override the default Whisper transcriber.
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
