import { useRoute, RouteProp } from "@react-navigation/native";
import { ChatScreen, ChatMessage, ChatSendPayload } from "../../../components/ChatScreen";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { getScope, ScopeId } from "../../../ai/scopes";
import {
  runChatTurn,
  buildChatText,
  chatScreenPropsFromConfig,
} from "../../../ai/core/runChatTurn";
import { defaultCameraHandler } from "../../../input/camera/cameraService";
import { clarityChatConfigs } from "../../../config/Chat_config";

type Route = RouteProp<RootStackParamList, "ClarityChat">;

export function ClarityChat() {
  const route = useRoute<Route>();
  const scopeId = (route.params?.scopeId || "clarityGeneralChat") as ScopeId;
  const initialMessage = route.params?.initialMessage;
  const scope = getScope(scopeId);
  const cfg = clarityChatConfigs[scopeId];

  const handleProcessMessage = (payload: ChatSendPayload, history: ChatMessage[]) =>
    runChatTurn(cfg, scope, buildChatText(cfg, history, payload.text?.trim() || ""));

  return (
    <ChatScreen
      {...chatScreenPropsFromConfig(cfg)}
      storageKey={`chat:${scope.id}`}
      onProcessMessage={handleProcessMessage}
      onCameraPress={cfg.cameraEnabled ? defaultCameraHandler : undefined}
      autoPrompt={initialMessage}
    />
  );
}
