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
import { useDocs } from "../../Docs/hooks/useDocs";

type Route = RouteProp<RootStackParamList, "CompanionChat">;

export function CompanionChat() {
  const route = useRoute<Route>();
  const { title } = route.params || {};
  const cfg = getCompanionChatConfig(title);
  const { docs } = useDocs();

  const familyEntries = useMemo(
    () => docs.filter((d) => d.category === "family").map((d) => ({ title: d.title, content: d.content })),
    [docs]
  );
  const memoryEntries = useMemo(
    () => docs.filter((d) => d.category === "memory").map((d) => ({ title: d.title, content: d.content })),
    [docs]
  );

  const scope: AIScope = useMemo(() => ({
    id: "companionChat",
    buildPrompt: (input: string) =>
      buildCompanionPrompt(input, title, { family: familyEntries, memory: memoryEntries }),
  }), [title, familyEntries, memoryEntries]);

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
