import { useMemo } from "react";
import { useRoute, RouteProp } from "@react-navigation/native";
import { ChatScreen, ChatMessage, ChatSendPayload } from "../../../components/ChatScreen";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { runAI } from "../../../ai/core/runAI";
import { whisperTranscribe } from "../../../ai/speech/whisperTranscriber";
import { buildCompanionPrompt } from "../../../ai/scopes/companionChat";
import { buildConversationContext } from "../../../ai/scopes/_shared";
import { AIScope } from "../../../ai/core/types";

type Route = RouteProp<RootStackParamList, "CompanionChat">;

const contextDescriptions: Record<string, string> = {
  "Brain Games":     "Let's give your mind a gentle workout with trivia and puzzles.",
  "Plan My Day":     "I'll help you plan a simple, balanced day.",
  "Calm Down":       "I'll guide you through some calming breathing and relaxation.",
  "Ask Anything":    "Ask me anything — tech, cooking, emails, or how things work.",
  "Share Stories":   "I'd love to hear your stories and memories.",
  "Family Tree":     "Let's talk about your family and the people you love.",
  "Write Letters":   "I'll help you write a heartfelt letter to someone you care about.",
  "Memory Book":     "Let's recall and cherish your favourite memories together.",
  "Creative Corner": "Let's get creative with a poem, story, or something beautiful.",
};

export function CompanionChat() {
  const route = useRoute<Route>();
  const { title, initialMessage } = route.params || {};

  const initialMessages = useMemo<ChatMessage[]>(
    () => [
      {
        role: "ai",
        text:
          initialMessage ||
          "Hello! I'm your companion. I'm here to chat, listen, and keep you company. What would you like to talk about today?",
      },
    ],
    [initialMessage]
  );

  const scope: AIScope = useMemo(() => ({
    id: "companionChat",
    buildPrompt: (input: string) => buildCompanionPrompt(input, title),
  }), [title]);

  const handleProcessMessage = async (payload: ChatSendPayload, history: ChatMessage[]) => {
    const text = buildConversationContext(history, payload.text?.trim() || "");
    const result = await runAI({ text, scope });

    const aiText =
      result.error
        ? "I'm sorry, I couldn't respond just now. Please try again."
        : typeof result.output === "string"
        ? result.output
        : typeof result.raw === "string"
        ? result.raw
        : "I'm here — please tell me more.";

    return { aiText };
  };

  const description = title ? contextDescriptions[title] : undefined;

  return (
    <ChatScreen
      title={title || "Companion Chat"}
      accentColor="#BB86FC"
      aiLabel="AI"
      storageKey={`chat:companion:${title || "general"}`}
      initialMessages={initialMessages}
      onProcessMessage={handleProcessMessage}
      disclaimer={description || "I'm here to chat, listen, and keep you company"}
      disclaimerSub="I'm an AI companion — for urgent concerns please speak to someone you trust."
      backTo="Companion"
      backLabel="Companion"
      speechEnabled
      onTranscribeAudio={whisperTranscribe}
    />
  );
}
