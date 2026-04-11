import { ChatScreen } from "../components/ChatScreen";

export function MedViewChat() {
  return (
    <ChatScreen
      title="MedView Chat"
      accentColor="#4CAF50"
      aiLabel="AI"
      initialAiMessage="Hello! I'm here to help you understand your medications. You can ask me about side effects, interactions, dosages, or anything else about your prescriptions. What would you like to know?"
      cannedReply="That's an important question about your medication. Generally speaking, it's best to follow the instructions on your prescription label and discuss any concerns with your pharmacist or doctor. Would you like me to explain anything else?"
      chips={["Side effects?", "With food?", "Missed dose?"]}
      disclaimer="AI helps you understand. Always confirm with your doctor."
      backTo="MedView"
      backLabel="MedView"
    />
  );
}
