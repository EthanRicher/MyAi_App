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
import { Camera, Send, Mic } from "lucide-react-native";
import { Audio } from "expo-av";
import { whisperTranscribe } from "../services/whisperService";
import { BackButton } from "./BackButton";
import { BackendRequiredModal } from "./BackendRequiredModal";
import { colors } from "../theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  onSendToAI?: (message: string) => Promise<string>;
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
  onSendToAI,
  chips = [],
  disclaimer,
  backTo,
  backLabel,
  backendRequired = false,
  backendDescription = "Backend required",
}: Props) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", text: initialAiMessage },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [showBackend, setShowBackend] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    if (backendRequired) {
      setShowBackend(true);
      return;
    }

    const clean = text.trim();

    setMessages((m) => [...m, { role: "user", text: clean }]);
    setInput("");
    setTyping(true);

    if (onSendToAI) {
      try {
        const reply = await onSendToAI(clean);
        setMessages((m) => [...m, { role: "ai", text: reply }]);
      } catch {
        setMessages((m) => [
          ...m,
          { role: "ai", text: "Error getting response" },
        ]);
      }
    } else {
      setTimeout(() => {
        setMessages((m) => [...m, { role: "ai", text: cannedReply }]);
      }, 1500);
    }

    setTyping(false);

    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      await rec.startAsync();

      setRecording(rec);
      setIsRecording(true);
    } catch {}
  };

  const stopRecording = async () => {
    if (!recording) return;

    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();

    setRecording(null);
    setIsRecording(false);

    if (!uri) return;

    const text = await whisperTranscribe(uri);

    if (text && !text.startsWith("Error")) {
      sendMessage(text);
    } else {
      setMessages((m) => [
        ...m,
        { role: "ai", text: text || "Error transcribing audio" },
      ]);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        <BackButton label={backLabel || "Back"} to={backTo} />

        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.messages}
          onContentSizeChange={() =>
            scrollRef.current?.scrollToEnd({ animated: true })
          }
        >
          {messages.map((m, i) =>
            m.role === "ai" ? (
              <View key={i} style={styles.aiBubbleWrap}>
                <View style={styles.aiBubble}>
                  <Text style={[styles.aiLabel, { color: accentColor }]}>
                    {aiLabel}
                  </Text>
                  <Text style={styles.messageText}>{m.text}</Text>
                </View>
              </View>
            ) : (
              <View key={i} style={styles.userBubbleWrap}>
                <View
                  style={[
                    styles.userBubble,
                    { backgroundColor: accentColor + "22" },
                  ]}
                >
                  <Text style={styles.messageText}>{m.text}</Text>
                </View>
              </View>
            )
          )}

          {typing && (
            <View style={styles.aiBubbleWrap}>
              <View style={styles.aiBubble}>
                <Text style={[styles.aiLabel, { color: accentColor }]}>
                  {aiLabel}
                </Text>
                <Text style={styles.messageText}>Typing...</Text>
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
              >
                <Text style={styles.chipText}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {!!disclaimer && (
          <Text style={styles.disclaimer}>{disclaimer}</Text>
        )}

        {isRecording && (
          <Text style={styles.recordingText}>Recording...</Text>
        )}

        <View
          style={[
            styles.inputRow,
            { paddingBottom: insets.bottom + 10 },
          ]}
        >
          <TouchableOpacity
            onPress={isRecording ? stopRecording : startRecording}
          >
            <Mic
              size={28}
              color={isRecording ? "red" : colors.textMuted}
            />
          </TouchableOpacity>

          <TouchableOpacity>
            <Camera size={28} color={colors.textMuted} />
          </TouchableOpacity>

          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type your message..."
            style={styles.input}
            onSubmitEditing={() => sendMessage(input)}
          />

          <TouchableOpacity
            onPress={() => sendMessage(input)}
            style={[styles.sendBtn, { backgroundColor: accentColor }]}
          >
            <Send size={20} color="#fff" />
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

  aiBubbleWrap: { alignItems: "flex-start" },
  userBubbleWrap: { alignItems: "flex-end" },

  aiBubble: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 16,
  },

  userBubble: {
    padding: 16,
    borderRadius: 16,
  },

  aiLabel: {
    fontWeight: "700",
    marginBottom: 4,
  },

  messageText: {
    color: colors.text,
  },

  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    padding: 10,
  },

  chip: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 10,
  },

  chipText: {
    color: colors.text,
  },

  disclaimer: {
    textAlign: "center",
    color: colors.textCaption,
  },

  recordingText: {
    color: "red",
    textAlign: "center",
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    gap: 10,
  },

  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 10,
    color: colors.text,
  },

  sendBtn: {
    padding: 10,
    borderRadius: 20,
  },
});