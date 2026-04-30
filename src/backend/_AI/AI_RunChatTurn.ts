import { runAI } from "./AI_Run";
import { extractAIText } from "../5_Output/Output_ExtractText";
import { runSaveOfferPost } from "../6_PostScope/Post_SaveOffer";
import { AIScope } from "./AI_Types";
import { buildConversationContext } from "../3_Scopes/_Common/Scope_Common_Conversation";
import { ChatConfig } from "../../config/_Common/ChatConfig_Type";
import { ChatMessage, ProcessResult } from "../../components/ChatScreen";

// All ChatScreen props that can be sourced directly from a ChatConfig.
// Spread the result into <ChatScreen /> and only specify per-screen extras
// (storageKey, scope, handlers, autoPrompt, etc).
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

// Run a single AI turn. For saveable chats, run the SaveOffer post-scope
// after the main reply lands and append its offer sentence (if any) to the
// displayed text. The clean main reply is what gets persisted as the saved
// content, separate from the offer sentence the user sees.
export async function runChatTurn(
  cfg: ChatConfig,
  scope: AIScope,
  text: string
): Promise<ProcessResult> {
  const result = await runAI({ text, scope, breakdownLength: cfg.breakdownLength });
  if (result.error) return { aiText: cfg.errorMessage, isError: true };

  const aiText = extractAIText(result, cfg.fallbackMessage);
  if (!cfg.saveable) return { aiText };

  const offer = await runSaveOfferPost({ userMessage: text, aiReply: aiText });
  if (!offer.shouldOffer || !offer.suggestedTitle || !offer.offerSentence) {
    return { aiText };
  }

  return {
    aiText: `${aiText}\n\n${offer.offerSentence}`,
    saveOffer: { suggestedTitle: offer.suggestedTitle, cleanContent: aiText },
  };
}
