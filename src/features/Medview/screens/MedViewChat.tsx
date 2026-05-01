import { useRoute, RouteProp } from "@react-navigation/native";
import { ChatScreen, ChatMessage, ChatSendPayload } from "../../../components/ChatScreen";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import {
  runChatTurn,
  buildChatText,
  chatScreenPropsFromConfig,
} from "../../../backend/_AI/AI_RunChatTurn";
import { defaultCameraHandler } from "../../../backend/1_Input/Camera/Input_Camera";
import { medviewMedicationChat } from "../../../backend/3_Scopes/MedView/Chat_Medication";
import { medviewChatConfig } from "../../../config/MedView";

type Route = RouteProp<RootStackParamList, "MedViewChat">;

export function MedViewChat() {
  const route = useRoute<Route>();
  const med = route.params?.med;
  const cfg = medviewChatConfig;
  const scope = medviewMedicationChat;

  const storageKey = med
    ? `chat:${scope.id}:${med.id}`
    : `chat:${scope.id}:general`;

  const handleProcessMessage = (payload: ChatSendPayload, history: ChatMessage[]) => {
    const message = payload.text?.trim() || "";
    const isInitial = history.length === 0;

    if (isInitial && med && scope.buildInitialPrompt) {
      return runChatTurn(cfg, scope, scope.buildInitialPrompt(med));
    }

    // Send the full medication context on every turn so the AI can answer
    // broad questions ("is it safe?", "is it good for me?", etc.) about
    // THIS specific med, not just whatever was in the chat history.
    const medHeader = med
      ? [
          "Medication context (the user is asking about this specific medication):",
          `- Name: ${med.name}`,
          `- Dose: ${med.dose}`,
          med.description ? `- Description / notes: ${med.description}` : null,
          med.times?.length ? `- Times per day: ${med.times.length} (${med.times.join(", ")})` : null,
          "",
        ]
          .filter(Boolean)
          .join("\n")
      : "";
    return runChatTurn(cfg, scope, medHeader + buildChatText(cfg, history, message));
  };

  return (
    <ChatScreen
      {...chatScreenPropsFromConfig(cfg)}
      storageKey={storageKey}
      onProcessMessage={handleProcessMessage}
      onCameraPress={cfg.cameraEnabled ? defaultCameraHandler : undefined}
      autoPrompt={med ? "Explain this medication." : undefined}
      clearOnLoad={!!med}
    />
  );
}
