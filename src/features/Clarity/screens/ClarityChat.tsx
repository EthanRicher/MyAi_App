import { useRoute, RouteProp } from "@react-navigation/native";
import { ChatScreen, ChatMessage, ChatSendPayload } from "../../../components/ChatScreen";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { clarityScopes, ScopeId } from "../../../backend/3_Scopes";
import {
  runChatTurn,
  buildChatText,
  chatScreenPropsFromConfig,
} from "../../../backend/_AI/AI_RunChatTurn";
import { defaultCameraHandler } from "../../../backend/1_Input/Camera/Input_Camera";
import { clarityChatConfigs } from "../../../config/Clarity";

type Route = RouteProp<RootStackParamList, "ClarityChat">;

export function ClarityChat() {
  const route = useRoute<Route>();
  const scopeId = (route.params?.scopeId || "clarityGeneralChat") as ScopeId;
  const initialMessage = route.params?.initialMessage;
  const scope = clarityScopes[scopeId];
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
