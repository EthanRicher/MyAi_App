import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Camera, Send, Mic, X, Keyboard } from "lucide-react-native";
import { BackButton } from "./BackButton";
import { BackendRequiredModal } from "./BackendRequiredModal";
import { colors } from "../theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSpeechInput } from "../ai/speech/useSpeechInput";
import { addDebugEntry } from "../ai/core/debug";
import { AIDebugPanel } from "./AIDebugPanel";

export interface ChatMessage {
  role: "ai" | "user";
  text?: string;
  imageUri?: string;
}

export interface ChatSendPayload {
  text?: string;
  imageUri?: string;
  hiddenText?: boolean;
}

export interface CameraInputResult {
  imageUri: string;
  text: string;
}

interface ProcessResult {
  aiText: string;
}

interface Props {
  title: string;
  accentColor: string;
  aiLabel?: string;
  storageKey: string;
  initialMessages: ChatMessage[];
  onProcessMessage: (message: ChatSendPayload) => Promise<ProcessResult>;
  chips?: string[];
  disclaimer?: string;
  backTo?: string;
  backLabel?: string;
  backendRequired?: boolean;
  backendDescription?: string;
  speechEnabled?: boolean;
  onTranscribeAudio?: (uri: string) => Promise<string>;
  onCameraPress?: () => Promise<CameraInputResult | null>;
  placeholder?: string;
}

export function ChatScreen({
  title: _title,
  accentColor,
  aiLabel = "AI",
  storageKey,
  initialMessages,
  onProcessMessage,
  chips = [],
  disclaimer,
  backTo,
  backLabel,
  backendRequired = false,
  backendDescription = "Backend required",
  speechEnabled = false,
  onTranscribeAudio,
  onCameraPress,
  placeholder = "Type your message...",
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [showBackend, setShowBackend] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const saved = await AsyncStorage.getItem(storageKey);

        if (saved) {
          setMessages(JSON.parse(saved));
          return;
        }

        setMessages(initialMessages);
        await AsyncStorage.setItem(storageKey, JSON.stringify(initialMessages));
      } catch {
        setMessages(initialMessages);
      }
    };

    loadMessages();
  }, [storageKey, initialMessages]);

  const persistMessages = async (nextMessages: ChatMessage[]) => {
    setMessages(nextMessages);
    await AsyncStorage.setItem(storageKey, JSON.stringify(nextMessages));
  };

  const sendPayload = async (payload: ChatSendPayload) => {
    const cleanText = payload.text?.trim() || "";
    const hasImage = !!payload.imageUri;

    if (!cleanText && !hasImage) {
      return;
    }

    if (backendRequired) {
      setShowBackend(true);
      return;
    }

    addDebugEntry("ChatScreen", "user_payload", {
      text: cleanText,
      imageUri: payload.imageUri || "",
      hiddenText: !!payload.hiddenText,
      storageKey,
    });

    const userMessage: ChatMessage = {
      role: "user",
      imageUri: payload.imageUri,
      text: payload.hiddenText || payload.imageUri ? "" : cleanText,
    };

    const nextWithUser = [...messages, userMessage];
    await persistMessages(nextWithUser);

    setInput("");
    setTyping(true);

    const result = await onProcessMessage({
      ...payload,
      text: cleanText,
    });

    const aiMessage: ChatMessage = {
      role: "ai",
      text: result.aiText,
    };

    const nextWithAi = [...nextWithUser, aiMessage];
    await persistMessages(nextWithAi);
    setTyping(false);

    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const {
    isRecording,
    speechError,
    clearSpeechError,
    startRecording,
    stopRecording,
  } = useSpeechInput({
    transcribe:
      onTranscribeAudio ||
      (async () => {
        return "Error: Speech transcription not enabled";
      }),
    onTranscript: async (text) => {
      addDebugEntry("ChatScreen", "transcript_message", text);
      await sendPayload({ text });
    },
  });

  const handleMicPress = async () => {
    clearSpeechError();

    if (backendRequired) {
      setShowBackend(true);
      return;
    }

    if (isRecording) {
      await stopRecording();
      return;
    }

    setShowTextInput(false);
    await startRecording();
  };

  const handleOpenText = () => {
    clearSpeechError();
    setShowTextInput(true);
  };

  const handleCloseText = () => {
    setShowTextInput(false);
    setInput("");
  };

  const handlePhotoPress = async () => {
    clearSpeechError();

    if (backendRequired) {
      setShowBackend(true);
      return;
    }

    if (!onCameraPress) {
      return;
    }

    const result = await onCameraPress();

    if (!result) {
      return;
    }

    setShowTextInput(false);

    await sendPayload({
      text: result.text,
      imageUri: result.imageUri,
      hiddenText: true,
    });
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
                  {!!m.imageUri && (
                    <Image source={{ uri: m.imageUri }} style={styles.messageImage} />
                  )}
                  {!!m.text && <Text style={styles.messageText}>{m.text}</Text>}
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
                  {!!m.imageUri && (
                    <Image source={{ uri: m.imageUri }} style={styles.messageImage} />
                  )}
                  {!!m.text && !m.imageUri && (
                    <Text style={styles.messageText}>{m.text}</Text>
                  )}
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

          <AIDebugPanel />
        </ScrollView>

        {chips.length > 0 && (
          <View style={styles.chipsWrap}>
            {chips.map((c, i) => (
              <TouchableOpacity
                key={`${c}-${i}`}
                onPress={() => sendPayload({ text: c })}
                style={[styles.chip, { borderColor: accentColor }]}
              >
                <Text style={styles.chipText}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {!!disclaimer && <Text style={styles.disclaimer}>{disclaimer}</Text>}
        {isRecording && <Text style={styles.recordingText}>Recording...</Text>}
        {!!speechError && <Text style={styles.errorText}>{speechError}</Text>}

        <View
          style={[
            styles.bottomWrap,
            { paddingBottom: insets.bottom + 10 },
          ]}
        >
          {showTextInput ? (
            <View style={styles.inputRow}>
              <TouchableOpacity onPress={handleCloseText} style={styles.modeBtn}>
                <X size={22} color={colors.text} />
              </TouchableOpacity>

              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder={placeholder}
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                onSubmitEditing={() => sendPayload({ text: input })}
                returnKeyType="send"
              />

              <TouchableOpacity
                onPress={() => sendPayload({ text: input })}
                style={[styles.sendBtn, { backgroundColor: accentColor }]}
              >
                <Send size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : isRecording ? (
            <TouchableOpacity
              onPress={handleMicPress}
              style={[styles.singleBtn, { borderColor: accentColor }]}
            >
              <X size={22} color={accentColor} />
              <Text style={[styles.actionText, { color: accentColor }]}>
                Stop Recording
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.actionsRow}>
              <TouchableOpacity
                onPress={handleMicPress}
                style={[styles.actionBtn, { borderColor: accentColor }]}
              >
                <Mic size={22} color={accentColor} />
                <Text style={[styles.actionText, { color: accentColor }]}>
                  Record
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleOpenText}
                style={[styles.actionBtn, { borderColor: accentColor }]}
              >
                <Keyboard size={22} color={accentColor} />
                <Text style={[styles.actionText, { color: accentColor }]}>
                  Type
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handlePhotoPress}
                style={[styles.actionBtn, { borderColor: accentColor }]}
              >
                <Camera size={22} color={accentColor} />
                <Text style={[styles.actionText, { color: accentColor }]}>
                  Photo
                </Text>
              </TouchableOpacity>
            </View>
          )}
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

  userBubbleWrap: {
    alignItems: "flex-end",
  },

  aiBubble: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 16,
    maxWidth: "90%",
    gap: 10,
  },

  userBubble: {
    padding: 16,
    borderRadius: 16,
    maxWidth: "90%",
    gap: 10,
  },

  aiLabel: {
    fontWeight: "700",
    marginBottom: 4,
  },

  messageText: {
    color: colors.text,
  },

  messageImage: {
    width: 180,
    height: 180,
    borderRadius: 14,
  },

  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 10,
    paddingTop: 10,
  },

  chip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    maxWidth: "48%",
  },

  chipText: {
    color: colors.text,
    flexWrap: "wrap",
  },

  disclaimer: {
    textAlign: "center",
    color: colors.textCaption,
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  recordingText: {
    color: "red",
    textAlign: "center",
    paddingTop: 6,
  },

  errorText: {
    color: "red",
    textAlign: "center",
    paddingTop: 6,
  },

  bottomWrap: {
    paddingHorizontal: 10,
    paddingTop: 10,
  },

  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },

  actionBtn: {
    flex: 1,
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: colors.card,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  singleBtn: {
    width: "100%",
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: colors.card,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  actionText: {
    fontSize: 15,
    fontWeight: "700",
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  modeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },

  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.text,
  },

  sendBtn: {
    padding: 10,
    borderRadius: 20,
  },
});