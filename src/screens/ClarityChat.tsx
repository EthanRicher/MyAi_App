import { useRoute, RouteProp } from "@react-navigation/native";
import { ChatScreen } from "../components/ChatScreen";
import { RootStackParamList } from "../navigation/AppNavigator";

type Route = RouteProp<RootStackParamList, "ClarityChat">;

export function ClarityChat() {
  const route = useRoute<Route>();
  const { title, initialMessage, chips } = route.params || {};

  return (
    <ChatScreen
      title={title || "Clarity Chat"}
      accentColor="#0dd9f7"
      aiLabel="AI"
      initialAiMessage={initialMessage || "Hello! I'm your Clarity assistant. I can help you understand medical information, documents, and more. What would you like help with today?"}
      cannedReply=""
      chips={chips || ["Explain something medical", "Help me understand a letter", "Prepare for my appointment"]}
      disclaimer="AI helps you understand. Always confirm with your doctor."
      backTo="Clarity"
      backLabel="Clarity"
      backendRequired
      backendDescription="Clarity Chat requires a backend with GPT processing to translate medical language, analyse documents, and generate personalised plain-language explanations."
    />
  );
}
