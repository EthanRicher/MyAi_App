import { useEffect, useRef, useState } from "react";
import { useUserProfile } from "../profile/hooks/useUserProfile";
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
import { AI_WARNING } from "../ai/scopes/_shared/warnings";
import { Camera, Send, Mic, X, Keyboard } from "lucide-react-native";
import { BackButton } from "./BackButton";
import { BackendRequiredModal } from "./BackendRequiredModal";
import { MessageReaderModal, ReaderMessage } from "./MessageReaderModal";
import { parseMarkdown } from "./markdown";
import { colors, warningColors, chatBubble, chatActionColors } from "../theme";
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
  warningText?: string;
  timestamp?: string;
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
  return parseMarkdown(text).map((token, i) => {
    switch (token.kind) {
      case "mainTitle":
        return (
          <View key={i} style={[styles.mainTitleChip, { backgroundColor: accentColor + "33", borderColor: accentColor + "88" }]}>
            <Text style={[styles.mainTitleText, { color: accentColor }]}>{token.text}</Text>
          </View>
        );
      case "subTitle":
        return (
          <View key={i} style={[styles.subTitleChip, { borderColor: accentColor + "55" }]}>
            <Text style={[styles.subTitleText, { color: accentColor }]}>{token.text}</Text>
          </View>
        );
      case "bullet":
        return (
          <View key={i} style={styles.bulletRow}>
            <Text style={[baseStyle, { color: accentColor }]}>{"•"}</Text>
            <Text style={[baseStyle, styles.bulletText]}>{token.text}</Text>
          </View>
        );
      case "paragraph":
        return <Text key={i} style={baseStyle}>{token.text}</Text>;
    }
  });
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
  onCameraPress?: (onImageReady: (imageUri: string) => void) => Promise<CameraInputResult | null>;
  placeholder?: string;
  autoPrompt?: string;
  messageWarning?: string;
  clearOnLoad?: boolean;
  starterPrompts?: string[];
  conversational?: boolean;
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
  starterPrompts,
  conversational = false,
}: Props) {
  const { profile } = useUserProfile();
  const userFirstName = profile.name.trim().split(" ")[0] || "You";

  const resolveWarning = (text: string, scopeWarning?: string): string | undefined => {
    const t = text.trimStart().toLowerCase();
    if (t.startsWith("sorry") || t.startsWith("i couldn't") || t.startsWith("i'm sorry")) return undefined;
    const hasStructure = text.includes("**") || text.includes("- ");
    const wordCount = text.trim().split(/\s+/).length;
    if (!hasStructure && wordCount < 40) return undefined;
    return scopeWarning ?? AI_WARNING;
  };

  const now = () => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [showBackend, setShowBackend] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [pendingAutoSend, setPendingAutoSend] = useState(false);
  const [readerPair, setReaderPair] = useState<ReaderMessage[] | null>(null);

  const isBreakdown = (t: string | undefined) =>
    !!t && (/\*\*[^*]+\*\*/.test(t) || /^[-•*]\s+/m.test(t));

  const openReader = (idx: number) => {
    const current = messages[idx];
    if (!current?.text || current.isError) return;

    const aiText =
      current.role === "ai" ? current.text : messages[idx + 1]?.text;
    const pairAllowed = conversational && !isBreakdown(aiText);

    const pair: ReaderMessage[] = [];
    if (!pairAllowed) {
      pair.push({
        role: current.role,
        text: current.text,
        label: current.role === "ai" ? aiLabel : userFirstName,
        warningText: current.role === "ai" ? current.warningText : undefined,
      });
    } else if (current.role === "ai") {
      const prev = messages[idx - 1];
      if (prev?.role === "user" && prev.text) {
        pair.push({ role: "user", text: prev.text, label: userFirstName });
      }
      pair.push({ role: "ai", text: current.text, label: aiLabel, warningText: current.warningText });
    } else {
      pair.push({ role: "user", text: current.text, label: userFirstName });
      const next = messages[idx + 1];
      if (next?.role === "ai" && next.text && !next.isError) {
        pair.push({ role: "ai", text: next.text, label: aiLabel, warningText: next.warningText });
      }
    }
    setReaderPair(pair);
  };

  const messagesRef = useRef<ChatMessage[]>([]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

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
          if (autoPrompt) setPendingAutoSend(true);
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

    const existing = messagesRef.current;
    const userMessage: ChatMessage = { role: "user", text: autoPrompt, timestamp: now() };
    const base = [...existing, userMessage];
    setMessages(base);
    setTyping(true);
    onProcessMessage({ text: autoPrompt }, settings.useHistory ? existing : []).then((result) => {
      const aiMessage: ChatMessage = { role: "ai", text: result.aiText, isError: result.isError, warningText: result.isError ? undefined : resolveWarning(result.aiText, messageWarning), timestamp: now() };
      const next = [...base, aiMessage];
      setMessages(next);
      if (settings.saveChatHistory) {
        AsyncStorage.setItem(storageKey, JSON.stringify(next));
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
      timestamp: now(),
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
      warningText: result.isError ? undefined : resolveWarning(result.aiText, messageWarning),
      timestamp: now(),
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
      timestamp: now(),
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
      const result = await onCameraPress((imageUri) => {
        const previewMessage: ChatMessage = {
          role: "user",
          imageUri,
          text: "",
          timestamp: now(),
        };
        setMessages((prev) => [...prev, previewMessage]);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      });

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
        <BackButton
          label={backLabel || "Back"}
          to={backTo}
          hideTitle
          right={
            <TouchableOpacity
              onPress={async () => {
                setMessages([]);
                await AsyncStorage.removeItem(storageKey);
              }}
              style={[styles.clearChatBtn, { borderColor: accentColor + "88", backgroundColor: accentColor + "18" }]}
            >
              <Text numberOfLines={1} style={[styles.clearChatBtnText, { color: accentColor }]}>Clear Chat</Text>
            </TouchableOpacity>
          }
        />

        {!!disclaimer && (
          <View style={[styles.disclaimerBanner, { backgroundColor: accentColor + "18", borderBottomColor: accentColor + "55" }]}>
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} style={[styles.disclaimerBannerTitle, { color: accentColor }]}>{disclaimer}</Text>
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
          {messages.length === 0 && !typing && settings.showStarterPrompts && starterPrompts && starterPrompts.length > 0 && (
            <View style={styles.starterPromptsWrap}>
              {starterPrompts.map((prompt) => (
                <TouchableOpacity
                  key={prompt}
                  onPress={() => sendPayload({ text: prompt })}
                  style={[styles.starterChip, { borderColor: accentColor + "88", backgroundColor: accentColor + "14" }]}
                >
                  <Text style={[styles.starterChipText, { color: accentColor }]}>{prompt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {messages.map((m, i) =>
            m.role === "ai" ? (
              <View key={i} style={styles.aiBubbleWrap}>
                <TouchableOpacity
                  activeOpacity={m.text && !m.isError ? 0.8 : 1}
                  onPress={() => openReader(i)}
                  onLongPress={() => openReader(i)}
                  style={styles.aiBubble}
                  accessibilityHint={m.text && !m.isError ? "Tap to read in full screen" : undefined}
                >
                  <View style={styles.bubbleLabelRow}>
                    <Text style={[styles.aiLabel, { color: accentColor }]}>{aiLabel}</Text>
                    {!!m.timestamp && <Text style={styles.timestamp}>{m.timestamp}</Text>}
                  </View>
                  {!!m.imageUri && (
                    <Image source={{ uri: m.imageUri }} style={styles.messageImage} />
                  )}
                  {!!m.text && (m.isError
                    ? <Text style={styles.errorBubbleText}>{m.text}</Text>
                    : renderMessageContent(m.text, accentColor, styles.messageText)
                  )}
                  {!!m.text && !m.isError && (
                    <View style={styles.fullscreenHintWrap}>
                      <View style={[styles.fullscreenHint, { borderColor: accentColor + "66", backgroundColor: accentColor + "22" }]}>
                        <Text style={[styles.fullscreenHintText, { color: accentColor }]}>Tap here to fullscreen</Text>
                      </View>
                    </View>
                  )}
                  {!!m.warningText && (
                    <View style={styles.messageWarningBanner}>
                      <Text style={styles.messageWarningIcon}>⚠️</Text>
                      <Text style={styles.messageWarningText}>{m.warningText}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View key={i} style={styles.userBubbleWrap}>
                <TouchableOpacity
                  activeOpacity={m.text ? 0.8 : 1}
                  onPress={() => openReader(i)}
                  onLongPress={() => openReader(i)}
                  style={[styles.userBubble, m.imageUri && !m.text ? styles.photoBubble : undefined]}
                  accessibilityHint={m.text ? "Tap to read in full screen" : undefined}
                >
                  <View style={styles.bubbleLabelRow}>
                    <Text style={styles.userLabel}>{userFirstName}</Text>
                    {!!m.timestamp && <Text style={styles.timestamp}>{m.timestamp}</Text>}
                  </View>
                  {!!m.imageUri && (
                    <Image source={{ uri: m.imageUri }} style={styles.messageImage} />
                  )}
                  {!!m.text && !m.imageUri && (
                    <Text style={styles.userBubbleText}>{m.text}</Text>
                  )}
                </TouchableOpacity>
              </View>
            )
          )}

          {typing && (
            <View style={styles.aiBubbleWrap}>
              <View style={styles.aiBubble}>
                <Text style={[styles.aiLabel, { color: accentColor }]}>{aiLabel}</Text>
                <Text style={styles.messageText}>Typing...</Text>
              </View>
            </View>
          )}

          <AIDebugPanel />
        </ScrollView>


        <View
          style={[
            styles.bottomWrap,
            { paddingBottom: insets.bottom + 4 },
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
                style={[styles.singleBtn, { borderColor: isRecording ? chatActionColors.recordActive : chatActionColors.record, backgroundColor: (isRecording ? chatActionColors.recordActive : chatActionColors.record) + "18" }]}
              >
                <Mic size={22} color={isRecording ? chatActionColors.recordActive : chatActionColors.record} />
                <Text style={[styles.actionText, { color: isRecording ? chatActionColors.recordActive : chatActionColors.record }]}>
                  {isRecording ? "Stop" : "Record"}
                </Text>
              </TouchableOpacity>

              {isRecording ? (
                <View style={styles.recordingLabelWrap}>
                  <Text style={[styles.recordingLabel, { color: chatActionColors.recordActive }]}>
                    Currently Recording...
                  </Text>
                </View>
              ) : (
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    onPress={handleOpenText}
                    style={[styles.actionBtn, { borderColor: chatActionColors.type, backgroundColor: chatActionColors.type + "18" }]}
                  >
                    <Keyboard size={22} color={chatActionColors.type} />
                    <Text style={[styles.actionText, { color: chatActionColors.type }]}>
                      Type
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handlePhotoPress}
                    style={[styles.actionBtn, { borderColor: chatActionColors.photo, backgroundColor: chatActionColors.photo + "18" }]}
                  >
                    <Camera size={22} color={chatActionColors.photo} />
                    <Text style={[styles.actionText, { color: chatActionColors.photo }]}>
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

        <MessageReaderModal
          visible={readerPair !== null}
          messages={readerPair || []}
          accentColor={accentColor}
          onClose={() => setReaderPair(null)}
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
    backgroundColor: chatBubble.ai,
    padding: 16,
    borderRadius: 16,
    width: "95%",
    gap: 10,
  },

  userBubble: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 16,
    width: "95%",
    gap: 10,
  },

  userBubbleText: {
    color: colors.text,
    fontSize: 16,
  },

  errorBubbleText: {
    color: colors.destructive,
    fontSize: 16,
    fontWeight: "700",
  },

  aiLabel: {
    fontWeight: "700",
    marginBottom: 4,
  },

  userLabel: {
    fontWeight: "700",
    color: colors.textMuted,
  },

  bubbleLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },

  fullscreenHintWrap: {
    alignItems: "center",
    marginTop: 4,
  },

  fullscreenHint: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1.5,
  },

  fullscreenHintText: {
    fontSize: 17,
    fontWeight: "700",
  },

  timestamp: {
    color: colors.textCaption,
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

  photoBubble: {
    width: undefined,
    alignSelf: "flex-end",
  },

  disclaimerBanner: {
    width: "100%",
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  disclaimerBannerTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  clearChatBtn: {
    height: 36,
    width: 110,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  clearChatBtnText: {
    fontSize: 15,
    fontWeight: "700",
  },
  messageWarningBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: warningColors.deepBg,
    borderTopWidth: 1,
    borderTopColor: warningColors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 8,
    marginHorizontal: -16,
    marginBottom: -16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    gap: 8,
  },
  messageWarningIcon: {
    fontSize: 13,
    lineHeight: 18,
  },
  messageWarningText: {
    flex: 1,
    fontSize: 12,
    color: warningColors.text,
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
    paddingTop: 8,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  actionsCol: {
    flexDirection: "column",
    gap: 8,
  },

  actionsRow: {
    flexDirection: "row",
    gap: 8,
  },

  actionBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: colors.card,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  singleBtn: {
    width: "100%",
    minHeight: 44,
    borderRadius: 14,
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

  starterPromptsWrap: {
    gap: 10,
    paddingVertical: 8,
  },
  starterChip: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: "center",
  },
  starterChipText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});