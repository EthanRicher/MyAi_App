import { useMemo } from "react";
import { useRoute, RouteProp } from "@react-navigation/native";
import { ChatScreen, ChatMessage, ChatSendPayload } from "../../../components/ChatScreen";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import {
  runChatTurn,
  buildChatText,
  chatScreenPropsFromConfig,
} from "../../../backend/_AI/AI_RunChatTurn";
import { getCompanionScope, getCompanionModeContext } from "../../../backend/3_Scopes/Companion";
import { formatExistingDocs } from "../../../backend/3_Scopes/Companion/Chat_CompanionBase";
import { getCompanionChatConfig } from "../../../config/Companion";
import { useDocs } from "../../Docs/hooks/useDocs";

/**
 * Companion chat screen. Hosts ChatScreen with the per-mode config
 * and scope. For Family Tree and Memory Book it also injects the
 * user's existing saved family / memory entries into the prompt so
 * the AI can recognise people and stories across turns.
 */

type Route = RouteProp<RootStackParamList, "CompanionChat">;

export function CompanionChat() {
  const route = useRoute<Route>();
  const { title } = route.params || {};
  const cfg = getCompanionChatConfig(title);
  const scope = useMemo(() => getCompanionScope(title), [title]);
  const modeContext = useMemo(() => getCompanionModeContext(title), [title]);
  const { docs } = useDocs();

  // Pull the doc subset this mode wants injected as context (if any).
  // The mode → docCategory mapping lives in the scope module so a
  // renamed or new context-aware mode only needs touching there.
  const contextEntries = useMemo(() => {
    if (!modeContext) return undefined;
    return docs
      .filter((d) => d.category === modeContext.docCategory)
      .map((d) => ({ title: d.title, content: d.content }));
  }, [docs, modeContext]);

  const handleProcessMessage = (payload: ChatSendPayload, history: ChatMessage[]) => {
    const message = payload.text?.trim() || "";

    // Family Tree / Memory Book scopes need the user's existing records
    // as context. Inject them into the input text so the scope can reason
    // over them (the scope itself stays a pure (input) => prompt builder).
    const contextPrefix = modeContext
      ? formatExistingDocs(modeContext.heading, contextEntries)
      : "";

    const text = contextPrefix + buildChatText(cfg, history, message);
    // Photo turns: skip the hardcoded distress guard on OCR'd content
    // (not the user's voice). Companion doesn't ship photo input today
    // but mirror the convention with the other chat handlers in case
    // it's added later.
    const currentMessage = payload.imageUri ? "" : message;
    return runChatTurn(cfg, scope, text, currentMessage);
  };

  return (
    <ChatScreen
      {...chatScreenPropsFromConfig(cfg)}
      storageKey={`chat:companion:${title || "general"}`}
      onProcessMessage={handleProcessMessage}
    />
  );
}
