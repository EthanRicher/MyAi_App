import { useMemo } from "react";
import { useRoute, RouteProp } from "@react-navigation/native";
import {
  ChatScreen,
  ChatMessage,
  ChatSendPayload,
} from "../../../components/ChatScreen";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { getScope, ScopeId } from "../../../ai/scopes";
import { runAI } from "../../../ai/core/runAI";
import { whisperTranscribe } from "../../../ai/speech/whisperTranscriber";
import { openCameraAndScan, PhotoMode } from "../../../ai/camera/cameraService";
import { buildConversationContext } from "../../../ai/scopes/_shared/conversation";
import { clarityChatConfigs } from "../../../config/chatConfigs";

type Route = RouteProp<RootStackParamList, "ClarityChat">;

const scopeTitles: Record<ScopeId, string> = {
  clarityAppointmentPrep: "Appointment Prep",
  clarityDoctorExplained: "Doctor Explained",
  clarityExplainEveryday: "Explain Everyday",
  clarityExplainMedication: "Explain Medication",
  clarityGeneralChat: "Clarity Chat",
  claritySummariseDocument: "Summarise Document",
  medviewMedicationChat: "Medication Chat",
  medviewMedicationScan: "Medication Scan",
  medviewScheduleSupport: "Schedule Support",
};

export function ClarityChat() {
  const route = useRoute<Route>();
  const scopeId = ((route.params as any)?.scopeId || "clarityGeneralChat") as ScopeId;
  const scope = getScope(scopeId);
  const config = clarityChatConfigs[scopeId];

  const storageKey = `chat:${scope.id}`;
  const initialMessages = useMemo<ChatMessage[]>(() => [], []);

  const handleProcessMessage = async (payload: ChatSendPayload, history: ChatMessage[]) => {
    const rawText = payload.text?.trim() || "";
    const text = scope.conversational
      ? buildConversationContext(history, rawText)
      : rawText;
    const result = await runAI({ text, scope });

    if (result.error) {
      return { aiText: "Sorry, I couldn't get a response. Please try again.", isError: true };
    }

    const aiText =
      typeof result.output === "string" ? result.output
      : typeof result.raw === "string" ? result.raw
      : "No response";

    return { aiText };
  };

  const handleCameraPress = (onImageReady: (uri: string) => void) =>
    openCameraAndScan(PhotoMode.VisionWithFallback, onImageReady);

  return (
    <ChatScreen
      title={scopeTitles[scopeId] || "Clarity Chat"}
      accentColor={config?.accentColor ?? "#0dd9f7"}
      aiLabel={config?.aiLabel ?? "AI"}
      storageKey={storageKey}
      initialMessages={initialMessages}
      onProcessMessage={handleProcessMessage}
      disclaimer={config?.disclaimer ?? "AI is here to help you understand"}
      disclaimerSub="Always confirm with your doctor before acting on anything here."
      messageWarning={scope.warning}
      backTo={config?.backTo ?? "Clarity"}
      backLabel={config?.backLabel ?? "Clarity"}
      speechEnabled={config?.speechEnabled ?? true}
      onTranscribeAudio={whisperTranscribe}
      onCameraPress={config?.cameraEnabled ? handleCameraPress : undefined}
    />
  );
}
