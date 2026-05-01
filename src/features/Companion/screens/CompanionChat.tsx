import { useMemo } from "react";
import { useRoute, RouteProp } from "@react-navigation/native";
import { ChatScreen, ChatMessage, ChatSendPayload } from "../../../components/ChatScreen";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import {
  runChatTurn,
  buildChatText,
  chatScreenPropsFromConfig,
} from "../../../backend/_AI/AI_RunChatTurn";
import { getCompanionScope } from "../../../backend/3_Scopes/Companion";
import { formatExistingDocs } from "../../../backend/3_Scopes/Companion/Scope_Common_Companion";
import { getCompanionChatConfig } from "../../../config/Companion";
import { useDocs } from "../../Docs/hooks/useDocs";

type Route = RouteProp<RootStackParamList, "CompanionChat">;

export function CompanionChat() {
  const route = useRoute<Route>();
  const { title } = route.params || {};
  const cfg = getCompanionChatConfig(title);
  const scope = useMemo(() => getCompanionScope(title), [title]);
  const { docs } = useDocs();

  const familyEntries = useMemo(
    () => docs.filter((d) => d.category === "family").map((d) => ({ title: d.title, content: d.content })),
    [docs]
  );
  const memoryEntries = useMemo(
    () => docs.filter((d) => d.category === "memory").map((d) => ({ title: d.title, content: d.content })),
    [docs]
  );

  const handleProcessMessage = (payload: ChatSendPayload, history: ChatMessage[]) => {
    const message = payload.text?.trim() || "";

    // Family Tree / Memory Book scopes need the user's existing records
    // as context. Inject them into the input text so the scope can reason
    // over them (the scope itself stays a pure (input) => prompt builder).
    let contextPrefix = "";
    if (title === "Family Tree") {
      contextPrefix = formatExistingDocs(
        "EXISTING FAMILY MEMBERS YOU'VE LEARNED ABOUT (use these to recognise people across turns):",
        familyEntries
      );
    } else if (title === "Memory Book") {
      contextPrefix = formatExistingDocs(
        "EXISTING MEMORIES YOU'VE LEARNED ABOUT (use these to recognise the memory across turns):",
        memoryEntries
      );
    }

    const text = contextPrefix + buildChatText(cfg, history, message);
    return runChatTurn(cfg, scope, text);
  };

  return (
    <ChatScreen
      {...chatScreenPropsFromConfig(cfg)}
      storageKey={`chat:companion:${title || "general"}`}
      onProcessMessage={handleProcessMessage}
    />
  );
}
