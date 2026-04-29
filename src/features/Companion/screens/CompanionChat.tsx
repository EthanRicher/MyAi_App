import { useMemo } from "react";
import { useRoute, RouteProp } from "@react-navigation/native";
import { ChatScreen, ChatMessage, ChatSendPayload } from "../../../components/ChatScreen";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import {
  runChatTurn,
  buildChatText,
  chatScreenPropsFromConfig,
} from "../../../ai/core/runChatTurn";
import { buildCompanionPrompt } from "../../../ai/scopes/companion/companionChat";
import { AIScope } from "../../../ai/core/types";
import { getCompanionChatConfig } from "../../../config/Chat_config";

type Route = RouteProp<RootStackParamList, "CompanionChat">;

export function CompanionChat() {
  const route = useRoute<Route>();
  const { title } = route.params || {};
  const cfg = getCompanionChatConfig(title);

  const scope: AIScope = useMemo(() => ({
    id: "companionChat",
    buildPrompt: (input: string) => buildCompanionPrompt(input, title),
  }), [title]);

  const handleProcessMessage = (payload: ChatSendPayload, history: ChatMessage[]) =>
    runChatTurn(cfg, scope, buildChatText(cfg, history, payload.text?.trim() || ""));

  return (
    <ChatScreen
      {...chatScreenPropsFromConfig(cfg)}
      storageKey={`chat:companion:${title || "general"}`}
      onProcessMessage={handleProcessMessage}
    />
  );
}
