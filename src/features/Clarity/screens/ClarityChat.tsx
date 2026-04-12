import { useMemo } from "react";
import { useRoute, RouteProp } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import {
  ChatScreen,
  ChatMessage,
  ChatSendPayload,
  CameraInputResult,
} from "../../../components/ChatScreen";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { getScope, ScopeId } from "../../../ai/scopes";
import { runAI } from "../../../ai/core/runAI";
import { whisperTranscribe } from "../../../ai/speech/whisperTranscriber";
import { runOCR } from "../../../ai/camera/ocrService";
import { addDebugEntry } from "../../../ai/core/debug";

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

const scopeInitialMessages: Record<ScopeId, string> = {
  clarityAppointmentPrep: "Let’s get ready for your appointment. Tell me what kind of visit you have coming up.",
  clarityDoctorExplained: "Tell me what your doctor said and I’ll explain it in simpler words.",
  clarityExplainEveryday: "I can explain bills, tech, admin, or everyday text in simpler language.",
  clarityExplainMedication: "Tell me the medication name or paste the medication text and I’ll explain it simply.",
  clarityGeneralChat: "Hello! I’m your Clarity assistant. Tell me what you want help understanding.",
  claritySummariseDocument: "Paste the document text and I’ll summarise it in plain English.",
  medviewMedicationChat: "Ask me about your medication.",
  medviewMedicationScan: "Send medication text and I’ll help extract it.",
  medviewScheduleSupport: "Ask me about your medication schedule.",
};

const scopeChips: Partial<Record<ScopeId, string[]>> = {
  clarityAppointmentPrep: ["GP visit", "Specialist visit", "What should I ask?"],
  clarityDoctorExplained: ["Explain what my doctor said", "Summarise this visit", "What should I do next?"],
  clarityExplainEveryday: ["Explain this bill", "Explain this term", "Summarise this"],
  clarityExplainMedication: ["What is this for?", "Side effects?", "When do I take it?"],
  clarityGeneralChat: ["Explain something medical", "Help with a document", "Prepare for appointment"],
  claritySummariseDocument: ["Summarise this letter", "Explain this report", "What does this mean?"],
};

export function ClarityChat() {
  const route = useRoute<Route>();
  const scopeId = ((route.params as any)?.scopeId || "clarityGeneralChat") as ScopeId;
  const scope = getScope(scopeId);

  const storageKey = `chat:${scope.id}`;
  const initialMessages = useMemo<ChatMessage[]>(
    () => [{ role: "ai", text: scopeInitialMessages[scopeId] || "Hello." }],
    [scopeId]
  );

  const handleProcessMessage = async (payload: ChatSendPayload) => {
    const result = await runAI({
      text: payload.text?.trim() || "",
      scope,
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

    addDebugEntry("ClarityChat", "raw_image_uri", rawUri);

    const manipulated = await ImageManipulator.manipulateAsync(
      rawUri,
      [{ resize: { width: 1200 } }],
      {
        compress: 0.6,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    const imageUri = manipulated.uri;

    addDebugEntry("ClarityChat", "compressed_image", manipulated);

    const ocrText = await runOCR(imageUri);

    addDebugEntry("ClarityChat", "ocr_text", ocrText);

    return {
      imageUri,
      text: ocrText?.trim()
        ? ocrText.trim()
        : "The photo was hard to read. Ask the user to retake it more clearly.",
    };
  };

  return (
    <ChatScreen
      title={scopeTitles[scopeId] || "Clarity Chat"}
      accentColor="#0dd9f7"
      aiLabel="AI"
      storageKey={storageKey}
      initialMessages={initialMessages}
      onProcessMessage={handleProcessMessage}
      chips={
        scopeChips[scopeId] || [
          "Explain something medical",
          "Help with a document",
          "Prepare for appointment",
        ]
      }
      disclaimer="AI helps you understand. Always confirm with your doctor."
      backTo="Clarity"
      backLabel="Clarity"
      speechEnabled
      onTranscribeAudio={whisperTranscribe}
      onCameraPress={handleCameraPress}
    />
  );
}