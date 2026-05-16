import type { DocCategory } from "../../features/Docs/models/Doc";
import type { DistressTier } from "./AI_DistressGuard";

/**
 * Shared chat data shapes between the UI and the AI pipeline. Live
 * in the backend (not in `components/ChatScreen`) so the runner and
 * scope code don't have to reach up into UI for their own types.
 * The chat surface re-exports these from its barrel for existing
 * UI consumers.
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
  savedIndicator?: "created" | "updated"; // Passive save outcome for this turn (Family Tree / Memory Book). "created" = green plus, "updated" = orange plus.
  distressTier?: DistressTier; // Distress tier the message tripped. Stamped on the user bubble that triggered the tier; renders an "AI flag" chip + coloured left strip in orange (AMBER) or red (RED).
}

// What the AI hands back for one turn.
export interface ProcessResult {
  aiText: string;        // The assistant's reply text.
  isError?: boolean;     // True when the turn failed (network, AI error, etc.).
  /**
   * Distress guard tier raised by the user's last message, when one
   * fired. ChatScreen stamps this onto the LAST user bubble (not the
   * AI reply) — see stampDistressOnLastUserMessage. The bubble then
   * shows the matching "AI flag" chip and coloured left strip.
   *
   * - "red"   the AI call was short-circuited; aiText is the canned
   *           crisis response baked into AI_DistressGuard.RED_RESPONSE
   * - "amber" the AI ran with AMBER_INSTRUCTION injected, so its
   *           reply uses the AMBER template; the save-offer flow is
   *           skipped for the turn
   */
  distressTier?: DistressTier;
  saveOffer?: {
    suggestedTitle: string;       // Title to pre-fill in the save modal.
    cleanContent: string;         // Body content to save into Docs.
    offerSentence?: string;       // Show the offer as its own bubble with a Tap to Save button.
    autoSave?: boolean;           // Passive categories (Family, Memory) save quietly in the background.
  };
}

// Marker import so DocCategory is treated as "intentionally referenced"
// from this barrel-friendly file; the type is consumed by callers via
// re-export, not directly here.
export type { DocCategory };
