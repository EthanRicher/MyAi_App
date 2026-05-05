import { useRef, useState } from "react";
import { useDocs } from "../features/Docs/hooks/useDocs";
import { DocCategory } from "../features/Docs/models/Doc";
import { debugLog } from "../backend/_AI/AI_Debug";

/**
 * Centralises everything around saving an AI reply into Docs:
 *   - the modal-open state (saveTarget + saveTitle)
 *   - the "yes save" affirmative detection
 *   - the pendingOfferRef the chat uses to remember the last save offer
 *   - the actual addDoc / upsertDocByTitle write
 *   - the passive upsert path (no modal) for Family + Memory chats
 *
 * ChatScreen used to own all of this inline; pulling it out keeps the
 * chat component focused on rendering and message flow.
 */

// "yes save" / "ok save" affirmatives. Only fires when there's a pending offer.
const SAVE_AFFIRMATIVE = /^(yes|yeah|yep|yup|ok|okay|sure|please|please save|do it|do save|save it|save this|save that|save them|save those|save these|save please)\b/i;
// Direct save commands like "save it", "save that", "save them".
const SAVE_COMMAND = /\bsave (it|this|that|them|those|these)\b/i;

export type SaveTarget = { text: string; suggestedTitle: string }; // Snapshot of what's about to be saved.
export type PendingOffer = { title: string; content: string };     // Last offer made by the AI.

// Pull a sensible title from the AI text. Prefers a markdown title, falls back to the first non-empty line.
const buildSuggestedTitle = (text: string): string => {
  const titleMatch = text.match(/^\*\*([^*\n]+)\*\*\s*$/m);
  if (titleMatch) return titleMatch[1].trim();
  const firstLine = text.split("\n").map((l) => l.trim()).find((l) => l.length > 0) || "";
  return firstLine.replace(/[*#:_-]/g, "").slice(0, 60).trim() || "Untitled";
};

export function useSaveFlow(saveCategory: DocCategory | undefined) {
  const { addDoc, upsertDocByTitle } = useDocs();
  const [saveTarget, setSaveTarget] = useState<SaveTarget | null>(null);
  const [saveTitle, setSaveTitle] = useState("");
  const pendingOfferRef = useRef<PendingOffer | null>(null);

  // Open the modal pre-filled with either an explicit title or one derived from the text.
  const openSaveModal = (text: string, suggested?: string) => {
    const title = suggested || buildSuggestedTitle(text);
    setSaveTitle(title);
    setSaveTarget({ text, suggestedTitle: title });
  };

  const cancelSave = () => {
    setSaveTarget(null);
    setSaveTitle("");
  };

  // Commit the save. Family and memory upsert by title so updates replace the previous version.
  const confirmSave = () => {
    if (!saveTarget || !saveCategory) return;
    const payload = {
      title: saveTitle.trim() || saveTarget.suggestedTitle,
      category: saveCategory,
      content: saveTarget.text,
    };
    if (saveCategory === "family" || saveCategory === "memory") {
      upsertDocByTitle(payload);
    } else {
      addDoc(payload);
    }
    debugLog("ChatScreen", "Result", "Doc saved", { category: saveCategory, title: saveTitle });
    setSaveTarget(null);
    setSaveTitle("");
  };

  /**
   * Passive save path used by Family Tree and Memory Book where the
   * system upserts on every save-worthy turn without showing a modal.
   */
  const passiveUpsert = (title: string, content: string) => {
    if (!saveCategory) return;
    upsertDocByTitle({ title, category: saveCategory, content });
    debugLog("ChatScreen", "Result", "Doc auto-saved", { category: saveCategory, title });
  };

  /**
   * Detects "yes save" / "save it" affirmatives in the user's message.
   * Bare affirmatives like "yes" only count when a pending offer exists.
   */
  const detectSaveIntent = (text: string): boolean => {
    const t = text.trim();
    if (!t) return false;
    if (pendingOfferRef.current && SAVE_AFFIRMATIVE.test(t)) return true;
    return SAVE_COMMAND.test(t) || /^(save|please save)\b/i.test(t);
  };

  return {
    saveTarget,
    saveTitle,
    setSaveTitle,
    pendingOfferRef,
    openSaveModal,
    cancelSave,
    confirmSave,
    passiveUpsert,
    detectSaveIntent,
  };
}
