import { callOpenAIJson } from "../_AI/AI_Fetch";
import { debugLog } from "../_AI/AI_Debug";
import { DocCategory } from "../../features/Docs/models/Doc";
import { buildSaveOfferPrompt, SaveOfferResult, SaveOfferTypeConfig } from "./SaveOffer/_Shared";
import { letterSaveOffer } from "./SaveOffer/Letter";
import { planSaveOffer } from "./SaveOffer/Plan";
import { familySaveOffer } from "./SaveOffer/Family";
import { memorySaveOffer } from "./SaveOffer/Memory";
import { summarySaveOffer } from "./SaveOffer/Summary";
import { doctorSaveOffer } from "./SaveOffer/Doctor";
import { appointmentSaveOffer } from "./SaveOffer/Appointment";

/**
 * Post-scope step that runs AFTER a saveable chat scope produces its
 * reply. Routes to a per-doc-type judge under SaveOffer/ based on
 * the chat's saveCategory, so each category can have its own "what
 * counts as save-worthy" rules and example titles. The shared prompt
 * frame lives in SaveOffer/_Shared.
 *
 * Lives in stage 4 because it consumes the main reply, not the user
 * input. Scopes themselves stay pure conversational generators.
 */

export type { SaveOfferResult } from "./SaveOffer/_Shared";

// One per-category judge config. Keys are DocCategory values so the lookup is exhaustive.
const TYPE_CONFIGS: Record<DocCategory, SaveOfferTypeConfig> = {
  letter: letterSaveOffer,
  plan: planSaveOffer,
  family: familySaveOffer,
  memory: memorySaveOffer,
  summary: summarySaveOffer,
  doctor: doctorSaveOffer,
  appointment: appointmentSaveOffer,
};

export async function runSaveOfferPost({
  userMessage,
  aiReply,
  category,
}: {
  userMessage: string;
  aiReply: string;
  category?: DocCategory;
}): Promise<SaveOfferResult> {
  if (!aiReply.trim()) return { shouldOffer: false };

  /**
   * No category means the chat is saveable but misconfigured. Skip
   * the offer rather than guess at a doc shape — the bug surfaces
   * cleanly that way.
   */
  const cfg = category ? TYPE_CONFIGS[category] : undefined;
  if (!cfg) {
    debugLog("Post_SaveOffer", "Result", "Skipped - no category", { category });
    return { shouldOffer: false };
  }
  const prompt = buildSaveOfferPrompt(cfg, userMessage, aiReply);

  // Single classifier call to decide and produce the storage shape in one go.
  const parsed = await callOpenAIJson<{
    shouldOffer: boolean;
    suggestedTitle: string;
    offerSentence: string;
    cleanContent: string;
  }>("Post_SaveOffer", prompt);
  if (!parsed || !parsed.shouldOffer) {
    debugLog("Post_SaveOffer", "Result", "Skipped - not save-worthy", { category });
    return { shouldOffer: false };
  }

  // Defensive cleanup. Trim and bound the title; treat empty strings as missing.
  const suggestedTitle =
    typeof parsed.suggestedTitle === "string" && parsed.suggestedTitle.trim()
      ? parsed.suggestedTitle.trim().slice(0, 60)
      : undefined;
  const offerSentence =
    typeof parsed.offerSentence === "string" && parsed.offerSentence.trim()
      ? parsed.offerSentence.trim()
      : undefined;
  const cleanContent =
    typeof parsed.cleanContent === "string" && parsed.cleanContent.trim()
      ? parsed.cleanContent.trim()
      : undefined;

  // Title and offer sentence are both required for an offer; otherwise drop it silently.
  if (!suggestedTitle || !offerSentence) {
    debugLog("Post_SaveOffer", "Result", "Skipped - not save-worthy", { category });
    return { shouldOffer: false };
  }

  debugLog("Post_SaveOffer", "Result", "Decision", {
    shouldOffer: true,
    category,
    suggestedTitle,
    cleanContentChars: cleanContent?.length ?? 0,
  });

  return { shouldOffer: true, suggestedTitle, offerSentence, cleanContent };
}
