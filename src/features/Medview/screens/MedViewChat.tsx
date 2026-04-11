import { ChatScreen } from "../../../components/ChatScreen";
import { colors } from "../../../theme";
import { useRoute } from "@react-navigation/native";
import { processWithAI } from "../../../services/aiService";

export function MedViewChat() {
  const route = useRoute<any>();
  const med = route.params?.med;

  const handleAI = async (message: string) => {
    const context = med
      ? `Medication: ${med.name}
Dose: ${med.dose}
Description: ${med.description}

User: ${message}`
      : message;

    const reply = await processWithAI(context, "Doctor_To_Client");
    return reply;
  };

  return (
    <ChatScreen
      title="Medication Chat"
      accentColor={colors.green}
      aiLabel="Med AI"
      initialAiMessage={
        med
          ? `Ask me anything about ${med.name}`
          : "Ask me about your medication"
      }
      cannedReply="..."
      onSendToAI={handleAI}
      chips={[
        "What is this?",
        "Side effects?",
        "When do I take it?",
      ]}
      disclaimer="This is not medical advice."
      backTo="MedView"
    />
  );
}