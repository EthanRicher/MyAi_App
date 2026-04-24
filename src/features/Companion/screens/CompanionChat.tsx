import { useMemo } from "react";
import { useRoute, RouteProp } from "@react-navigation/native";
import { ChatScreen, ChatMessage, ChatSendPayload } from "../../../components/ChatScreen";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { runAI } from "../../../ai/core/runAI";
import { whisperTranscribe } from "../../../ai/speech/whisperTranscriber";
import { buildCompanionPrompt } from "../../../ai/scopes/companion/companionChat";
import { buildConversationContext } from "../../../ai/scopes/_shared/conversation";
import { AIScope } from "../../../ai/core/types";
import { companionChatConfig } from "../../../config/chatConfigs";

type Route = RouteProp<RootStackParamList, "CompanionChat">;

export function CompanionChat() {
  const route = useRoute<Route>();
  const { title, initialMessage } = route.params || {};
  const cfg = companionChatConfig;

  const initialMessages = useMemo<ChatMessage[]>(() => [], []);

  const scope: AIScope = useMemo(() => ({
    id: "companionChat",
    buildPrompt: (input: string) => buildCompanionPrompt(input, title),
  }), [title]);

  const handleProcessMessage = async (payload: ChatSendPayload, history: ChatMessage[]) => {
    const text = buildConversationContext(history, payload.text?.trim() || "");
    const result = await runAI({ text, scope, breakdownLength: cfg.breakdownLength });

    if (result.error) {
      return { aiText: "I'm sorry, I didn't quite catch that. Could you try again?", isError: true };
    }

    const aiText =
      typeof result.output === "string" ? result.output
      : typeof result.raw === "string" ? result.raw
      : "I'm here — please tell me more.";

    return { aiText };
  };

  const disclaimer = title
    ? cfg.modeDisclaimers[title] ?? cfg.defaultDisclaimer
    : cfg.defaultDisclaimer;
  const starterPrompts = title ? cfg.modeStarterPrompts[title] : undefined;

  return (
    <ChatScreen
      title={title || "Companion Chat"}
      accentColor={cfg.accentColor}
      aiLabel={cfg.aiLabel}
      storageKey={`chat:companion:${title || "general"}`}
      initialMessages={initialMessages}
      onProcessMessage={handleProcessMessage}
      disclaimer={disclaimer}
      disclaimerSub="I'm an AI companion — for urgent concerns please speak to someone you trust."
      backTo={cfg.backTo}
      backLabel={cfg.backLabel}
      speechEnabled={cfg.speechEnabled}
      onTranscribeAudio={whisperTranscribe}
      starterPrompts={starterPrompts}
      conversational={cfg.conversational}
    />
  );
}
