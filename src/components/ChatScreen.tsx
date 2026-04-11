import { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Camera, Send } from "lucide-react-native";
import { BackButton } from "./BackButton";
import { BackendRequiredModal } from "./BackendRequiredModal";
import { colors } from "../theme";

interface Message {
  role: "ai" | "user";
  text: string;
}

interface Props {
  title: string;
  accentColor: string;
  aiLabel?: string;
  initialAiMessage: string;
  cannedReply: string;
  chips?: string[];
  disclaimer?: string;
  backTo?: string;
  backLabel?: string;
  simulated?: boolean;
  backendRequired?: boolean;
  backendDescription?: string;
}

export function ChatScreen({
  title,
  accentColor,
  aiLabel = "AI",
  initialAiMessage,
  cannedReply,
  chips = [],
  disclaimer,
  backTo,
  backLabel,
  simulated = false,
  backendRequired = false,
  backendDescription = "This feature requires a backend with GPT processing to generate real AI responses.",
}: Props) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", text: initialAiMessage },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [showBackend, setShowBackend] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    if (backendRequired) {
      setShowBackend(true);
      return;
    }
    setMessages((m) => [...m, { role: "user", text: text.trim() }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setMessages((m) => [...m, { role: "ai", text: cannedReply }]);
      setTyping(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }, 1500);
  };

  const handleCameraPress = () => {
    if (backendRequired) {
      setShowBackend(true);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <View style={styles.container}>
        <BackButton label={backLabel || "Back"} to={backTo} />

        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.messages}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((m, i) =>
            m.role === "ai" ? (
              <View key={i} style={styles.aiBubbleWrap}>
                <View style={styles.aiBubble}>
                  <Text style={[styles.aiLabel, { color: accentColor }]}>{aiLabel}</Text>
                  <Text style={styles.messageText}>{m.text}</Text>
                </View>
              </View>
            ) : (
              <View key={i} style={styles.userBubbleWrap}>
                <View style={[styles.userBubble, { backgroundColor: accentColor + "22" }]}>
                  <Text style={styles.messageText}>{m.text}</Text>
                </View>
              </View>
            )
          )}
          {typing && (
            <View style={styles.aiBubbleWrap}>
              <View style={styles.aiBubble}>
                <Text style={[styles.aiLabel, { color: accentColor }]}>{aiLabel}</Text>
                <View style={styles.typingDots}>
                  <View style={[styles.dot, { backgroundColor: accentColor }]} />
                  <View style={[styles.dot, { backgroundColor: accentColor }]} />
                  <View style={[styles.dot, { backgroundColor: accentColor }]} />
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {chips.length > 0 && (
          <View style={styles.chipsRow}>
            {chips.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => sendMessage(c)}
                style={[styles.chip, { borderColor: accentColor }]}
                accessibilityLabel={c}
              >
                <Text style={styles.chipText}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {!!disclaimer && (
          <Text style={styles.disclaimer}>{disclaimer}</Text>
        )}

        <View style={styles.inputRow}>
          <TouchableOpacity onPress={handleCameraPress} style={styles.cameraBtn} accessibilityLabel="Camera">
            <Camera size={32} color={colors.textMuted} />
          </TouchableOpacity>
          <View style={styles.inputWrap}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Type your message..."
              placeholderTextColor={colors.textCaption}
              style={styles.input}
              onSubmitEditing={() => sendMessage(input)}
              returnKeyType="send"
              accessibilityLabel="Message input"
            />
          </View>
          <TouchableOpacity
            onPress={() => sendMessage(input || "message")}
            style={[styles.sendBtn, { backgroundColor: accentColor }]}
            accessibilityLabel="Send message"
          >
            <Send size={26} color={colors.background} />
          </TouchableOpacity>
        </View>

        <BackendRequiredModal
          open={showBackend}
          onClose={() => setShowBackend(false)}
          description={backendDescription}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  messages: {
    padding: 16,
    gap: 16,
  },
  aiBubbleWrap: {
    alignItems: "flex-start",
  },
  aiBubble: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    maxWidth: "85%",
  },
  aiLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },
  userBubbleWrap: {
    alignItems: "flex-end",
  },
  userBubble: {
    borderRadius: 16,
    padding: 16,
    maxWidth: "85%",
  },
  messageText: {
    color: colors.text,
    fontSize: 18,
    lineHeight: 27,
  },
  typingDots: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipsRow: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    color: colors.text,
    fontSize: 16,
  },
  disclaimer: {
    textAlign: "center",
    color: colors.textCaption,
    fontSize: 14,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    gap: 12,
  },
  cameraBtn: {
    flexShrink: 0,
  },
  inputWrap: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  input: {
    color: colors.text,
    fontSize: 18,
  },
  sendBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});
