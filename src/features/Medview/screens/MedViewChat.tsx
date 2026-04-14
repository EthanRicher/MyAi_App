import { useMemo } from "react";
import { useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import {
  ChatScreen,
  ChatMessage,
  ChatSendPayload,
  CameraInputResult,
} from "../../../components/ChatScreen";
import { colors } from "../../../theme";
import { runAI } from "../../../ai/core/runAI";
import { whisperTranscribe } from "../../../ai/speech/whisperTranscriber";
import { runOCR } from "../../../ai/camera/ocrService";
import { addDebugEntry } from "../../../ai/core/debug";
import { medviewMedicationChat } from "../../../ai/scopes/medviewMedicationChat";

export function MedViewChat() {
  const route = useRoute<any>();
  const med = route.params?.med;

  const storageKey = med
    ? `chat:medviewMedicationChat:${med.id}`
    : "chat:medviewMedicationChat:general";

  const initialMessages = useMemo<ChatMessage[]>(
    () => [
      {
        role: "ai",
        text: med
          ? `Ask me anything about ${med.name}.`
          : "Ask me about your medication.",
      },
    ],
    [med]
  );

  const handleProcessMessage = async (payload: ChatSendPayload, _history: unknown) => {
    const message = payload.text?.trim() || "";

    const context = med
      ? `Medication: ${med.name}
Dose: ${med.dose}
Description: ${med.description}

User: ${message}`
      : message;

    const result = await runAI({
      text: context,
      scope: medviewMedicationChat,
    });

    const aiText =
      result.error
        ? "Something went wrong."
        : typeof result.output === "string"
        ? result.output
        : typeof result.raw === "string"
        ? result.raw
        : "No response";

    return {
      aiText,
    };
  };

  const handleCameraPress = async (): Promise<CameraInputResult | null> => {
    const result = await ImagePicker.launchCameraAsync({
      quality: 1,
    });

    if (result.canceled) {
      return null;
    }

    const rawUri = result.assets[0].uri;

    addDebugEntry("MedViewChat", "raw_image_uri", rawUri);

    const manipulated = await ImageManipulator.manipulateAsync(
      rawUri,
      [{ resize: { width: 1200 } }],
      {
        compress: 0.6,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    const imageUri = manipulated.uri;

    addDebugEntry("MedViewChat", "compressed_image", manipulated);

    const ocrText = await runOCR(imageUri);

    addDebugEntry("MedViewChat", "ocr_text", ocrText);

    return {
      imageUri,
      text: ocrText?.trim()
        ? ocrText.trim()
        : "The photo was hard to read. Ask the user to retake it more clearly.",
    };
  };

  return (
    <ChatScreen
      title="Medication Chat"
      accentColor={colors.green}
      aiLabel="Med AI"
      storageKey={storageKey}
      initialMessages={initialMessages}
      onProcessMessage={handleProcessMessage}
      disclaimer={med ? `Ask me anything about ${med.name}` : "Ask me questions about your medications"}
      disclaimerSub="This is not medical advice. Always confirm with your doctor."
      backTo="MedView"
      speechEnabled
      onTranscribeAudio={whisperTranscribe}
      onCameraPress={handleCameraPress}
    />
  );
}