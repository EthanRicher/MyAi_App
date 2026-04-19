import { useMemo } from "react";
import { useRoute, RouteProp } from "@react-navigation/native";
import { ChatScreen, ChatMessage, ChatSendPayload } from "../../../components/ChatScreen";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { runAI } from "../../../ai/core/runAI";
import { whisperTranscribe } from "../../../ai/speech/whisperTranscriber";
import { buildCompanionPrompt } from "../../../ai/scopes/companion/companionChat";
import { buildConversationContext } from "../../../ai/scopes/_shared/conversation";
import { AIScope } from "../../../ai/core/types";

type Route = RouteProp<RootStackParamList, "CompanionChat">;

const contextDescriptions: Record<string, string> = {
  "Brain Games":     "Trivia, puzzles and brain teasers",
  "Plan My Day":     "Let's plan a simple, balanced day",
  "Calm Down":       "Calming breathing and relaxation",
  "Ask Anything":    "Ask me anything — tech, cooking, emails",
  "Share Stories":   "I'd love to hear your stories",
  "Family Tree":     "Let's talk about your family",
  "Write Letters":   "I'll help you write a heartfelt letter",
  "Memory Book":     "Let's cherish your favourite memories",
  "Creative Corner": "Poems, stories and creative activities",
};

export function CompanionChat() {
  const route = useRoute<Route>();
  const { title, initialMessage } = route.params || {};

  const initialMessages = useMemo<ChatMessage[]>(() => [], []);

  const scope: AIScope = useMemo(() => ({
    id: "companionChat",
    buildPrompt: (input: string) => buildCompanionPrompt(input, title),
  }), [title]);

  const handleProcessMessage = async (payload: ChatSendPayload, history: ChatMessage[]) => {
    const text = buildConversationContext(history, payload.text?.trim() || "");
    const result = await runAI({ text, scope });

    if (result.error) {
      return { aiText: "I'm sorry, I didn't quite catch that. Could you try again?", isError: true };
    }

    const aiText =
      typeof result.output === "string" ? result.output
      : typeof result.raw === "string" ? result.raw
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
      disclaimer={description || "I'm here to chat and keep you company"}
      disclaimerSub="I'm an AI companion — for urgent concerns please speak to someone you trust."
      backTo="Companion"
      backLabel="Companion"
      speechEnabled
      onTranscribeAudio={whisperTranscribe}
    />
  );
}
