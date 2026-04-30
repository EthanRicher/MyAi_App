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

// When a chat is saveable, the AI is told to ask the user about saving once
// something save-worthy is finished. The marker is stripped from the visible
// reply by ChatScreen and used to pre-fill the save modal.
const SAVE_OFFER_INSTRUCTION = `

SAVE OFFER (CRITICAL):
- If the user has just produced or finalised something save-worthy in this turn (a complete letter draft, a finished daily plan, family-member info, a recorded memory, a poem, a story, a structured note), conversationally ASK whether they want to save it OR keep working on it. Phrase the choice warmly and clearly — for example:
  • "Would you like to save these plans or keep planning?"
  • "Want me to save this letter, or shall we keep editing it?"
  • "Should I save these family notes, or do you want to add more?"
  • "Want me to save this memory, or keep going?"
- Always frame it as TWO options: save now, or continue. Never imply saving is the only path.
- WHEN AND ONLY WHEN you ask, append on a brand new line at the very END of your reply (after every other line, including the question):
  [OFFER_SAVE: title="<short suggested title, max 60 chars, no quotes>"]
- The marker MUST be on its own final line. Do not mention or describe it — the app strips it from the user's view.
- Do NOT include the marker while still drafting, brainstorming, or asking clarifying questions — only when a complete artefact exists that the user could save and reuse.
- Never include the marker in greetings, small talk, or generic replies.
- The user will reply with "yes" / "sure" / "save it" to save, or with more content / "keep going" to continue.
`;

// Run a single AI turn and map the result into the shape ChatScreen expects,
// using the chat's configured error/fallback copy.
export async function runChatTurn(
  cfg: ChatConfig,
  scope: AIScope,
  text: string
): Promise<ProcessResult> {
  const effectiveScope: AIScope = cfg.saveable
    ? { ...scope, buildPrompt: (t: string) => scope.buildPrompt(t) + SAVE_OFFER_INSTRUCTION }
    : scope;
  const result = await runAI({ text, scope: effectiveScope, breakdownLength: cfg.breakdownLength });
  if (result.error) return { aiText: cfg.errorMessage, isError: true };
  return { aiText: extractAIText(result, cfg.fallbackMessage) };
}
