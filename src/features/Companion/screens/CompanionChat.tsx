import { useMemo } from "react";
import { useRoute, RouteProp } from "@react-navigation/native";
import { ChatScreen, ChatMessage, ChatSendPayload } from "../../../components/ChatScreen";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import {
  runChatTurn,
  buildChatText,
  chatScreenPropsFromConfig,
} from "../../../backend/4_AI/AI_RunChatTurn";
import { buildCompanionPrompt } from "../../../backend/3_Scopes/Companion/Chat_Companion";
import { AIScope } from "../../../backend/4_AI/AI_Types";
import { getCompanionChatConfig } from "../../../config/Companion";
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
