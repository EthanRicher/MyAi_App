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
import { openCameraAndScan } from "../../../ai/camera/cameraService";
import { buildConversationContext } from "../../../ai/scopes/_shared";

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

const scopeDescriptions: Record<ScopeId, string> = {
  clarityAppointmentPrep: "I’ll help you prepare for your appointment.",
  clarityDoctorExplained: "I’ll explain what your doctor said in plain language.",
  clarityExplainEveryday: "I’ll simplify bills, letters, and everyday text.",
  clarityExplainMedication: "I’ll explain what your medication does and how to take it.",
  clarityGeneralChat: "I’ll help you understand health or medical topics.",
  claritySummariseDocument: "I’ll summarise your medical document in plain English.",
  medviewMedicationChat: "Ask me anything about your medications.",
  medviewMedicationScan: "Send a photo or text of a label and I’ll explain it.",
  medviewScheduleSupport: "I’ll help you understand your medication schedule.",
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

  const handleCameraPress = openCameraAndScan;

  return (
    <ChatScreen
      title={scopeTitles[scopeId] || "Clarity Chat"}
      accentColor="#0dd9f7"
      aiLabel="AI"
      storageKey={storageKey}
      initialMessages={initialMessages}
      onProcessMessage={handleProcessMessage}
      disclaimer={scopeDescriptions[scopeId] || "AI is here to help you understand"}
      disclaimerSub="Always confirm with your doctor before acting on anything here."
      messageWarning={scope.warning}
      backTo="Clarity"
      backLabel="Clarity"
      speechEnabled
      onTranscribeAudio={whisperTranscribe}
      onCameraPress={handleCameraPress}
    />
  );
}