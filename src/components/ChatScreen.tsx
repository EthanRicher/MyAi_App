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
import { useAISettings } from "../hooks/useAISettings";

export interface ChatMessage {
  role: "ai" | "user";
  text?: string;
  imageUri?: string;
  isError?: boolean;
  showWarning?: boolean;
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
  isError?: boolean;
}

function renderMessageContent(text: string, accentColor: string, baseStyle: object) {
  let mainTitleSeen = false;
  return text.split("\n").map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return null;

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
  autoPrompt?: string;
  messageWarning?: string;
  clearOnLoad?: boolean;
}

export function ChatScreen({
  title: _title,
  accentColor,
  aiLabel = "AI",
  storageKey,
  initialMessages,
  onProcessMessage,
  disclaimer,
  disclaimerSub: _disclaimerSub,
  backTo,
  backLabel,
  backendRequired = false,
  backendDescription = "Backend required",
  speechEnabled: _speechEnabled = false,
  onTranscribeAudio,
  onCameraPress,
  placeholder = "Type your message...",
  autoPrompt,
  messageWarning,
  clearOnLoad = false,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [showBackend, setShowBackend] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [pendingAutoSend, setPendingAutoSend] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const { settings } = useAISettings();

  useEffect(() => {
    const loadMessages = async () => {
      try {
        if (clearOnLoad || settings.clearOnExit) {
          await AsyncStorage.removeItem(storageKey);
        }

        if (!settings.saveChatHistory) {
          setMessages(initialMessages);
          if (autoPrompt) setPendingAutoSend(true);
          return;
        }

        const saved = await AsyncStorage.getItem(storageKey);

        if (saved) {
          const parsed: ChatMessage[] = JSON.parse(saved);
          setMessages(parsed);
          if (autoPrompt && parsed.every((m) => m.role === "ai") && parsed.length <= 1) {
            setPendingAutoSend(true);
          }
          return;
        }

        setMessages(initialMessages);
        await AsyncStorage.setItem(storageKey, JSON.stringify(initialMessages));
        if (autoPrompt) setPendingAutoSend(true);
      } catch {
        setMessages(initialMessages);
      }
    };

    loadMessages();
  }, [storageKey, settings.saveChatHistory]);

  useEffect(() => {
    return () => {
      if (settings.clearOnExit) {
        AsyncStorage.removeItem(storageKey);
      }
    };
  }, [storageKey, settings.clearOnExit]);


  useEffect(() => {
    if (!pendingAutoSend || !autoPrompt) return;
    setPendingAutoSend(false);

    setMessages([]);
    setTyping(true);
    onProcessMessage({ text: autoPrompt }, []).then((result) => {
      const aiMessage: ChatMessage = { role: "ai", text: result.aiText, isError: result.isError, showWarning: !result.isError && !!messageWarning };
      setMessages([aiMessage]);
      if (settings.saveChatHistory) {
        AsyncStorage.setItem(storageKey, JSON.stringify([aiMessage]));
      }
      setTyping(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    });
  }, [pendingAutoSend]);

  const persistMessages = async (nextMessages: ChatMessage[]) => {
    setMessages(nextMessages);
    if (settings.saveChatHistory) {
      await AsyncStorage.setItem(storageKey, JSON.stringify(nextMessages));
    }
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
    }, settings.useHistory ? messages : []);

    const aiMessage: ChatMessage = {
      role: "ai",
      text: result.aiText,
      isError: result.isError,
      showWarning: !result.isError && !!messageWarning,
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

  useEffect(() => {
    if (!speechError) return;
    const errorMessage: ChatMessage = {
      role: "ai",
      text: "I couldn't hear you. Please try again.",
      isError: true,
    };
    setMessages((prev) => [...prev, errorMessage]);
    clearSpeechError();
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [speechError]);

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

    try {
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
    } catch (err: any) {
      addDebugEntry("ChatScreen", "photo_press_error", err?.message || "Photo failed");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <BackButton label={backLabel || "Back"} to={backTo} />

        {!!disclaimer && (
          <View style={[styles.disclaimerBanner, { backgroundColor: accentColor + "18", borderBottomColor: accentColor + "55" }]}>
            <Text style={[styles.disclaimerBannerTitle, { color: accentColor }]}>{disclaimer}</Text>
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
                <View style={[styles.aiBubble, m.isError && styles.aiBubbleError]}>
                  <Text style={[styles.aiLabel, { color: accentColor }]}>
                    {aiLabel}
                  </Text>
                  {!!m.imageUri && (
                    <Image source={{ uri: m.imageUri }} style={styles.messageImage} />
                  )}
                  {!!m.text && renderMessageContent(m.text, accentColor, styles.messageText)}
                  {!!m.showWarning && !!messageWarning && (
                    <View style={styles.messageWarningBanner}>
                      <Text style={styles.messageWarningIcon}>⚠️</Text>
                      <Text style={styles.messageWarningText}>{messageWarning}</Text>
                    </View>
                  )}
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
          ) : (
            <View style={styles.actionsCol}>
              <TouchableOpacity
                onPress={handleMicPress}
                style={[styles.singleBtn, { borderColor: isRecording ? "#cc3333" : accentColor }]}
              >
                <Mic size={22} color={isRecording ? "#cc3333" : accentColor} />
                <Text style={[styles.actionText, { color: isRecording ? "#cc3333" : accentColor }]}>
                  {isRecording ? "Stop" : "Record"}
                </Text>
              </TouchableOpacity>

              {isRecording ? (
                <View style={styles.recordingLabelWrap}>
                  <Text style={[styles.recordingLabel, { color: "#cc3333" }]}>
                    Currently Recording...
                  </Text>
                </View>
              ) : (
                <View style={styles.actionsRow}>
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

  aiBubbleError: {
    backgroundColor: "#2a0a0a",
    borderWidth: 1,
    borderColor: "#7f1f1f",
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
    width: "100%",
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  disclaimerBannerTitle: {
    fontSize: 13,
    textAlign: "center",
    fontWeight: "600",
  },
  messageWarningBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#2A2000",
    borderWidth: 1,
    borderColor: "#F9A825",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 8,
    gap: 8,
  },
  messageWarningIcon: {
    fontSize: 13,
    lineHeight: 18,
  },
  messageWarningText: {
    flex: 1,
    fontSize: 12,
    color: "#FFD54F",
    lineHeight: 18,
    fontWeight: "500",
  },

  recordingLabelWrap: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },

  recordingLabel: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
  },

  recordingText: {
    color: "red",
    textAlign: "center",
    paddingTop: 6,
  },

  speechErrorWrap: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },

  speechErrorBubble: {
    width: "100%",
  },

  speechErrorText: {
    color: colors.text,
    fontSize: 15,
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

  actionsCol: {
    flexDirection: "column",
    gap: 10,
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
    fontSize: 24,
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