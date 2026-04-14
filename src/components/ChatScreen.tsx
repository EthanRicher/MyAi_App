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

function renderMessageContent(text: string, accentColor: string, baseStyle: object) {
  let mainTitleSeen = false;
  return text.split("\n").map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return null;

    // Title: **Title** — first one is main, rest are subtitles
    const titleMatch = trimmed.match(/^\*\*([^*]+)\*\*:?$/);
    if (titleMatch) {
      const rawTitle = titleMatch[1].replace(/^:+|:+$/g, "").trim();
      const titleText = rawTitle.length > 30 ? rawTitle.slice(0, 30).trimEnd() + "…" : rawTitle;
      if (!mainTitleSeen) {
        mainTitleSeen = true;
        return (
          <View key={i} style={[styles.mainTitleChip, { backgroundColor: accentColor + "33", borderColor: accentColor + "88" }]}>
            <Text style={[styles.mainTitleText, { color: accentColor }]}>{titleText}</Text>
          </View>
        );
      }
      return (
        <View key={i} style={[styles.subTitleChip, { borderColor: accentColor + "55" }]}>
          <Text style={[styles.subTitleText, { color: accentColor }]}>{titleText}</Text>
        </View>
      );
    }

    // Bullet point: - item or • item
    const bulletMatch = trimmed.match(/^[-•*]\s+(.+)$/);
    if (bulletMatch) {
      return (
        <View key={i} style={styles.bulletRow}>
          <Text style={[baseStyle, { color: accentColor }]}>{"•"}</Text>
          <Text style={[baseStyle, styles.bulletText]}>{bulletMatch[1]}</Text>
        </View>
      );
    }

    return <Text key={i} style={baseStyle}>{trimmed}</Text>;
  }).filter(Boolean);
}

interface Props {
  title: string;
  accentColor: string;
  aiLabel?: string;
  storageKey: string;
  initialMessages: ChatMessage[];
  onProcessMessage: (message: ChatSendPayload, history: ChatMessage[]) => Promise<ProcessResult>;
  disclaimer?: string;
  disclaimerSub?: string;
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
  disclaimer,
  disclaimerSub,
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
    }, messages);

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
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <BackButton label={backLabel || "Back"} to={backTo} />

        {!!disclaimer && (
          <View style={[styles.disclaimerBanner, { backgroundColor: accentColor + "22", borderColor: accentColor + "55" }]}>
            <Text style={[styles.disclaimerBannerTitle, { color: accentColor }]}>{disclaimer}</Text>
            {!!disclaimerSub && (
              <Text style={[styles.disclaimerBannerSub, { color: accentColor + "bb" }]}>{disclaimerSub}</Text>
            )}
          </View>
        )}

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
                  {!!m.text && renderMessageContent(m.text, accentColor, styles.messageText)}
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
  flex: { flex: 1, backgroundColor: colors.background },

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
    width: "95%",
    gap: 10,
  },

  userBubble: {
    padding: 16,
    borderRadius: 16,
    width: "95%",
    gap: 10,
  },

  aiLabel: {
    fontWeight: "700",
    marginBottom: 4,
  },

  messageText: {
    color: colors.text,
  },

  mainTitleChip: {
    alignSelf: "stretch",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
  },
  mainTitleText: {
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
  },
  subTitleChip: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderLeftWidth: 3,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  subTitleText: {
    fontSize: 14,
    fontWeight: "700",
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  bulletText: {
    flex: 1,
  },

  messageImage: {
    width: 180,
    height: 180,
    borderRadius: 14,
  },

  disclaimerBanner: {
    alignSelf: "center",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 8,
    marginBottom: 4,
    maxWidth: "92%",
    gap: 4,
  },
  disclaimerBannerTitle: {
    fontSize: 16,
    textAlign: "center",
    fontWeight: "700",
  },
  disclaimerBannerSub: {
    fontSize: 13,
    textAlign: "center",
    fontWeight: "400",
    lineHeight: 18,
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