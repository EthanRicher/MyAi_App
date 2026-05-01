import { useRef, useState } from "react";
import { useDocs } from "../features/Docs/hooks/useDocs";
import { DocCategory } from "../features/Docs/models/Doc";
import { debugLog } from "../backend/_AI/AI_Debug";

// Centralises everything related to saving an AI reply into Docs:
//   - the modal-open state (saveTarget + saveTitle)
//   - the "yes save" affirmative detection
//   - the pendingOfferRef the chat uses to remember the last save offer
//   - the actual addDoc / upsertDocByTitle write
//   - the passive upsert path (no modal) for Family + Memory chats
//
// ChatScreen used to own all of this inline; pulling it out keeps the
// chat component focused on rendering and message flow.

const SAVE_AFFIRMATIVE = /^(yes|yeah|yep|yup|ok|okay|sure|please|please save|do it|do save|save it|save this|save that|save them|save those|save these|save please)\b/i;
const SAVE_COMMAND = /\bsave (it|this|that|them|those|these)\b/i;

export type SaveTarget = { text: string; suggestedTitle: string };
export type PendingOffer = { title: string; content: string };

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

  const openSaveModal = (text: string, suggested?: string) => {
    const title = suggested || buildSuggestedTitle(text);
    setSaveTitle(title);
    setSaveTarget({ text, suggestedTitle: title });
  };

  const cancelSave = () => {
    setSaveTarget(null);
    setSaveTitle("");
  };

  const confirmSave = () => {
    if (!saveTarget || !saveCategory) return;
    const payload = {
      title: saveTitle.trim() || saveTarget.suggestedTitle,
      category: saveCategory,
      content: saveTarget.text,
    };
    // Family + memory entries upsert by title so the AI's full updated
    // record replaces the previous version instead of creating duplicates.
    if (saveCategory === "family" || saveCategory === "memory") {
      upsertDocByTitle(payload);
    } else {
      addDoc(payload);
    }
    debugLog("ChatScreen", "Result", "Doc saved", { category: saveCategory, title: saveTitle });
    setSaveTarget(null);
    setSaveTitle("");
  };

  // Passive save path used by Family Tree / Memory Book where the system
  // upserts on every save-worthy turn without a modal.
  const passiveUpsert = (title: string, content: string) => {
    if (!saveCategory) return;
    upsertDocByTitle({ title, category: saveCategory, content });
    debugLog("ChatScreen", "Result", "Doc auto-saved", { category: saveCategory, title });
  };

  // Detects "yes save" / "save it" affirmatives in the user's message —
  // requires a pending offer to be present for bare affirmatives ("yes").
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
