import { runAI } from "./AI_Run";
import { debugLog } from "./AI_Debug";
import { extractAIText } from "../5_Output/Output_ExtractText";
import { runSaveOfferPost } from "../4_Post_Scope/Post_SaveOffer";
import { AIScope } from "./AI_Types";
import { buildConversationContext } from "../3_Scopes/_Common/Scope_Common_Conversation";
import { ChatConfig } from "../../config/_Common/ChatConfig_Type";
import { ChatMessage, ProcessResult } from "../../components/ChatScreen";
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
   * history prepended. The distress guard scans only this so a
   * past "kill myself" still living in the transcript doesn't keep
   * re-firing RED on every later message. When omitted, falls back
   * to the wrapped `text` for backward-compat with callers that
   * haven't been updated.
   */
  currentMessage?: string
): Promise<ProcessResult> {
  // Hardcoded distress guard runs first so a user in crisis never
  // depends on the model classifying their message correctly. RED
  // short-circuits the AI call entirely; AMBER forces the AI onto the
  // AMBER template via a prepended instruction.
  const distress = checkDistress(currentMessage ?? text);
  if (distress.tier === "red") {
    return { aiText: RED_RESPONSE, distressTier: "red" };
  }

  const guardedText =
    distress.tier === "amber" ? `${AMBER_INSTRUCTION}\n\n${text}` : text;

  // Main AI call.
  const result = await runAI({ text: guardedText, scope, breakdownLength: cfg.breakdownLength });
  if (result.error) return { aiText: cfg.errorMessage, isError: true };

  // Parse the model's own tier tag and strip it from the displayed
  // text. The tier rides back on ProcessResult; ChatScreen stamps it
  // onto the USER bubble that prompted this turn (the flag belongs
  // to what the user said, not the AI's reply).
  const rawAiText = extractAIText(result, cfg.fallbackMessage);
  const { tier: aiJudgedTier, cleanText: aiText } = parseTierTag(rawAiText);

  // Log the FINAL tier the AI applied this turn. This overrides any
  // earlier "DistressGuard AMBER/RED Triggered" log from the hardcoded
  // backstop — e.g. if the backstop matched AMBER but the AI escalated
  // to the RED template, the authoritative tier is RED. Makes it easy
  // to grep transcripts for what actually happened on a given turn.
  if (aiJudgedTier) {
    debugLog(
      "DistressGuard",
      aiJudgedTier.toUpperCase(),
      "AI tier (final, overrides hardcoded match)",
      { tier: aiJudgedTier },
    );
  }

  // Skip the save-offer flow entirely when the chat is non-saveable
  // OR when the AI judged this turn distress — a distressed user
  // shouldn't get a "Tap to Save" prompt competing with the support
  // nudge.
  if (!cfg.saveable || aiJudgedTier) {
    return aiJudgedTier ? { aiText, distressTier: aiJudgedTier } : { aiText };
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
