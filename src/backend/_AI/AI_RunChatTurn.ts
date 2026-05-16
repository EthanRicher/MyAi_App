import { runAI } from "./AI_Run";
import { debugLog } from "./AI_Debug";
import { extractAIText } from "../5_Output/Output_ExtractText";
import { runSaveOfferPost } from "../4_Post_Scope/Post_SaveOffer";
import { AIScope } from "./AI_Types";
import { buildConversationContext } from "../3_Scopes/_Common/Scope_Common_Conversation";
import { ChatConfig } from "../../config/_Common/ChatConfig_Type";
import { ChatMessage, ProcessResult } from "./AI_ChatTypes";
import { DocCategory } from "../../features/Docs/models/Doc";
import { checkDistress, RED_RESPONSE, AMBER_INSTRUCTION, parseTierTag } from "./AI_DistressGuard";

/**
 * One-shot helper that runs a single AI turn for a chat. Talks to
 * the main runAI, then optionally runs the SaveOffer post-scope so
 * the chat can show a "tap to save" card. Used by every feature
 * screen that drives ChatScreen.
 */

/**
 * Categories that get persisted in the BACKGROUND on every save-worthy
 * turn, instead of asking the user to confirm. The ChatScreen reads
 * autoSave on the resulting saveOffer and upserts by title silently,
 * so the user just keeps chatting and the record keeps refining.
 */
const PASSIVE_SAVE_CATEGORIES = new Set<DocCategory>(["family", "memory"]);

/**
 * All ChatScreen props that can be sourced directly from a ChatConfig.
 * Spread the result into <ChatScreen /> and only specify per-screen
 * extras (storageKey, scope, handlers, autoPrompt, etc.).
 */
export function chatScreenPropsFromConfig(cfg: ChatConfig) {
  return {
    accentColor: cfg.accentColor,
    aiLabel: cfg.aiLabel,
    disclaimer: cfg.disclaimer,
    placeholder: cfg.placeholder,
    typingLabel: cfg.typingLabel,
    speechErrorMessage: cfg.speechErrorMessage,
    backTo: cfg.backTo,
    backLabel: cfg.backLabel,
    starterPrompts: cfg.starterPrompts,
    messageWarning: cfg.warning,
    conversational: cfg.conversational,
    saveable: cfg.saveable,
    saveCategory: cfg.saveCategory,
  };
}

// Apply the conversational-context wrapper if the chat is configured for it.
export function buildChatText(
  cfg: ChatConfig,
  history: ChatMessage[],
  text: string
): string {
  return cfg.conversational ? buildConversationContext(history, text) : text;
}

/**
 * Run a single AI turn. For saveable chats, run the SaveOffer
 * post-scope after the main reply lands and append its offer
 * sentence (if any) to the displayed text. The clean main reply is
 * what gets persisted as the saved content, separate from the offer
 * sentence the user sees.
 */
export async function runChatTurn(
  cfg: ChatConfig,
  scope: AIScope,
  text: string,
  /**
   * The current user turn ON ITS OWN — without any conversation
   * history prepended. The distress guard scans only this so a past
   * "kill myself" still living in the transcript doesn't keep
   * re-firing RED on every later message. Pass an empty string for
   * system-generated turns (initial prompts, OCR'd content) so the
   * guard correctly sees "nothing to scan".
   */
  currentMessage: string,
  /**
   * True when this turn carries a photo (Vision / OCR analysis as
   * `text`). Routes runAI through `scope.buildPhotoPrompt` when the
   * scope has one — otherwise photo turns silently use the regular
   * text prompt and the photo-specific instructions never reach the
   * model.
   */
  isPhoto: boolean = false,
): Promise<ProcessResult> {
  // Hardcoded distress guard runs first so a user in crisis never
  // depends on the model classifying their message correctly. RED
  // short-circuits the AI call entirely; AMBER forces the AI onto the
  // AMBER template via a prepended instruction.
  const distress = checkDistress(currentMessage);
  if (distress.tier === "red") {
    return { aiText: RED_RESPONSE, distressTier: "red" };
  }

  const guardedText =
    distress.tier === "amber" ? `${AMBER_INSTRUCTION}\n\n${text}` : text;

  // Main AI call.
  const result = await runAI({ text: guardedText, scope, breakdownLength: cfg.breakdownLength, isPhoto });
  if (result.error) return { aiText: cfg.errorMessage, isError: true };

  // Parse the model's own tier tag and strip it from the displayed
  // text. The tier rides back on ProcessResult; ChatScreen stamps it
  // onto the USER bubble that prompted this turn (the flag belongs
  // to what the user said, not the AI's reply).
  const rawAiText = extractAIText(result, cfg.fallbackMessage);
  const { tier: aiJudgedTier, cleanText: aiText } = parseTierTag(rawAiText);

  // Final tier: the AI's own judgement wins when it tagged the turn
  // (it may escalate AMBER → RED), but if it omits the tag entirely
  // we still honour the hardcoded backstop — otherwise a confirmed
  // AMBER hit by the phrase list silently disappears when the model
  // forgets the tier marker.
  const finalTier = aiJudgedTier ?? distress.tier ?? undefined;

  // Log the FINAL tier this turn ended up with so transcripts read
  // straight. Mark which side decided it.
  if (finalTier) {
    debugLog(
      "DistressGuard",
      finalTier.toUpperCase(),
      aiJudgedTier ? "AI tier (final)" : "Hardcoded tier (AI omitted tag)",
      { tier: finalTier },
    );
  }

  // Skip the save-offer flow entirely when the chat is non-saveable
  // OR when this turn has any distress tier — a distressed user
  // shouldn't get a "Tap to Save" prompt competing with the support
  // nudge.
  if (!cfg.saveable || finalTier) {
    return finalTier ? { aiText, distressTier: finalTier } : { aiText };
  }

  // Save-offer post-scope. Decides whether and how to offer a save.
  const offer = await runSaveOfferPost({
    userMessage: text,
    aiReply: aiText,
    category: cfg.saveCategory,
  });
  if (!offer.shouldOffer || !offer.suggestedTitle) {
    return { aiText };
  }

  const isPassive =
    cfg.saveCategory !== undefined && PASSIVE_SAVE_CATEGORIES.has(cfg.saveCategory);

  // Passive flow. Persist silently; no offer sentence in the chat.
  if (isPassive) {
    return {
      aiText,
      saveOffer: {
        suggestedTitle: offer.suggestedTitle,
        cleanContent: offer.cleanContent || aiText,
        autoSave: true,
      },
    };
  }

  // Offer flow. Needs a one-sentence offer text. Without it we just return the clean reply.
  if (!offer.offerSentence) return { aiText };

  return {
    aiText,
    saveOffer: {
      suggestedTitle: offer.suggestedTitle,
      cleanContent: offer.cleanContent || aiText,
      offerSentence: offer.offerSentence,
    },
  };
}
