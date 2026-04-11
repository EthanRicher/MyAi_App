import { useRoute, RouteProp } from "@react-navigation/native";
import { ChatScreen } from "../../../components/ChatScreen";
import { RootStackParamList } from "../../../navigation/AppNavigator";

type Route = RouteProp<RootStackParamList, "CompanionChat">;

export function CompanionChat() {
  const route = useRoute<Route>();
  const { title, initialMessage } = route.params || {};

  return (
    <ChatScreen
      title={title || "Companion Chat"}
      accentColor="#BB86FC"
      aiLabel="AI"
      initialAiMessage={initialMessage || "Hello! I'm your companion. I'm here to chat, listen, and keep you company. What would you like to talk about today?"}
      cannedReply="That's really lovely to hear. Thank you for sharing that with me. I enjoy our conversations — they always brighten my day. Is there anything else you'd like to talk about?"
      chips={["Tell me more", "That's interesting", "What else?"]}
      disclaimer="Simulated — responses are pre-written."
      backTo="Companion"
      backLabel="Companion"
      simulated
    />
  );
}
