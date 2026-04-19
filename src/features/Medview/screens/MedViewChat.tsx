import { useMemo } from "react";
import { useRoute } from "@react-navigation/native";
import {
  ChatScreen,
  ChatMessage,
  ChatSendPayload,
} from "../../../components/ChatScreen";
import { colors } from "../../../theme";
import { runAI } from "../../../ai/core/runAI";
import { whisperTranscribe } from "../../../ai/speech/whisperTranscriber";
import { openCameraAndScan, PhotoMode } from "../../../ai/camera/cameraService";
import { medviewMedicationChat } from "../../../ai/scopes/medview/medicationChat";
import { buildConversationContext } from "../../../ai/scopes/_shared/conversation";
import { buildSharedPrompt } from "../../../ai/scopes/_shared/formats";

export function MedViewChat() {
  const route = useRoute<any>();
  const med = route.params?.med;

  const storageKey = med
    ? `chat:medviewMedicationChat:${med.id}`
    : "chat:medviewMedicationChat:general";

  const initialMessages = useMemo<ChatMessage[]>(() => [], []);

  const handleProcessMessage = async (payload: ChatSendPayload, history: ChatMessage[]) => {
    const message = payload.text?.trim() || "";
    const isInitial = history.length === 0;

    let context: string;

    if (isInitial && med) {
      context = `Medication: ${med.name}
Dose: ${med.dose}
Description: ${med.description}

Explain this medication. Cover what it is for, how it is taken, and key things to know.`;
    } else {
      const medHeader = med
        ? `Medication context: ${med.name}, ${med.dose}\n\n`
        : "";
      context = `${medHeader}${buildConversationContext(history, message)}`;
    }

    const result = await runAI({
      text: context,
      scope: isInitial && med
        ? { ...medviewMedicationChat, buildPrompt: (t) => buildSharedPrompt(t, "breakdown", medviewMedicationChat.topic) }
        : medviewMedicationChat,
    });

    if (result.error) {
      return { aiText: "Sorry, I couldn't get a response. Please try again.", isError: true };
    }

    const aiText =
      typeof result.output === "string" ? result.output
      : typeof result.raw === "string" ? result.raw
      : "No response";

    return { aiText };
  };

  return (
    <ChatScreen
      title="MedView Chat"
      accentColor={colors.green}
      aiLabel="MedView AI"
      storageKey={storageKey}
      initialMessages={initialMessages}
      onProcessMessage={handleProcessMessage}
      disclaimer="I'm here to explain your medication"
      disclaimerSub="This is not medical advice. Always confirm with your doctor."
      backTo="MedView"
      backLabel="MedView Chat"
      speechEnabled
      onTranscribeAudio={whisperTranscribe}
      onCameraPress={(onImageReady) => openCameraAndScan(PhotoMode.VisionWithFallback, onImageReady)}
      autoPrompt={med ? "Explain this medication." : undefined}
      clearOnLoad={!!med}
      messageWarning={medviewMedicationChat.warning}
    />
  );
}