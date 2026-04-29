import { runAI } from "./runAI";
import { extractAIText } from "./extractAIText";
import { AIScope } from "./types";
import { buildConversationContext } from "../scopes/_shared/conversation";
import { ChatConfig } from "../../config/Chat_config";
import { ChatMessage, ProcessResult } from "../../components/ChatScreen";

// All ChatScreen props that can be sourced directly from a ChatConfig.
// Spread the result into <ChatScreen /> and only specify per-screen extras
// (storageKey, scope, handlers, autoPrompt, etc).
export function chatScreenPropsFromConfig(cfg: ChatConfig) {
  return {
    title: cfg.title,
    accentColor: cfg.accentColor,
    aiLabel: cfg.aiLabel,
    disclaimer: cfg.disclaimer,
    disclaimerSub: cfg.disclaimerSub,
    placeholder: cfg.placeholder,
    typingLabel: cfg.typingLabel,
    speechErrorMessage: cfg.speechErrorMessage,
    backTo: cfg.backTo,
    backLabel: cfg.backLabel,
    speechEnabled: cfg.speechEnabled,
    starterPrompts: cfg.starterPrompts,
    messageWarning: cfg.warning,
    conversational: cfg.conversational,
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

// Run a single AI turn and map the result into the shape ChatScreen expects,
// using the chat's configured error/fallback copy.
export async function runChatTurn(
  cfg: ChatConfig,
  scope: AIScope,
  text: string
): Promise<ProcessResult> {
  const result = await runAI({ text, scope, breakdownLength: cfg.breakdownLength });
  if (result.error) return { aiText: cfg.errorMessage, isError: true };
  return { aiText: extractAIText(result, cfg.fallbackMessage) };
}
