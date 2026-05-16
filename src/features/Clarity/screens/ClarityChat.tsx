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

/**
 * Clarity chat screen. Picks the scope and config by the scopeId
 * route param, then mounts ChatScreen. Supports an optional
 * initialMessage that fires as the auto-prompt.
 */

type Route = RouteProp<RootStackParamList, "ClarityChat">;

export function ClarityChat() {
  const route = useRoute<Route>();
  const scopeId = (route.params?.scopeId || "clarityGeneralChat") as ScopeId;
  const initialMessage = route.params?.initialMessage;
  const scope = clarityScopes[scopeId];
  const cfg = clarityChatConfigs[scopeId];

  const handleProcessMessage = (payload: ChatSendPayload, history: ChatMessage[]) => {
    const message = payload.text?.trim() || "";
    // Photo turns: OCR'd document content isn't the user's voice, so
    // we don't want the hardcoded distress guard scanning it. Pass an
    // empty string as currentMessage to skip the check; the wrapped
    // text (with the OCR) still flows to the AI. `isPhoto` routes
    // the scope through buildPhotoPrompt when it has one.
    const isPhoto = !!payload.imageUri;
    const currentMessage = isPhoto ? "" : message;
    return runChatTurn(cfg, scope, buildChatText(cfg, history, message), currentMessage, isPhoto);
  };

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
