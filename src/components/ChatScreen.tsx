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
  Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AI_WARNING } from "../ai/scopes/_shared/warnings";
import { Camera, Send, Mic, X, Keyboard } from "lucide-react-native";
import { BackButton } from "./BackButton";
import { MessageReaderModal, ReaderMessage } from "./MessageReaderModal";
import { parseMarkdown, parseInline } from "./markdown";
import { scanKeywords } from "../config/Keywords_config";
import { colors, warningColors, chatBubble, chatActionColors } from "../theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSpeechInput } from "../input/speech/useSpeechInput";
import { whisperTranscribe } from "../input/speech/whisperTranscriber";
import { addDebugEntry } from "../ai/core/debug";
import { translateToEnglish } from "../ai/core/translate";
import { useDocs } from "../features/Docs/hooks/useDocs";
import { useAlerts } from "../features/Docs/hooks/useAlerts";
import { DocCategory } from "../features/Docs/models/Doc";
import { AIDebugPanel } from "./AIDebugPanel";
import { useAISettings } from "../hooks/useAISettings";

export interface ChatMessage {
  role: "ai" | "user";
  text?: string;
  imageUri?: string;
  isError?: boolean;
  warningText?: string;
  timestamp?: string;
  isTranslation?: boolean;
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

export interface ProcessResult {
  aiText: string;
  isError?: boolean;
}

const renderInline = (text: string) =>
  parseInline(text).map((seg, j) =>
    seg.kind === "bold"
      ? <Text key={j} style={{ fontWeight: "700" }}>{seg.text}</Text>
      : seg.text
  );

function renderMessageContent(text: string, accentColor: string, baseStyle: object) {
  return parseMarkdown(text).map((token, i) => {
    switch (token.kind) {
      case "mainTitle":
        return (
          <View key={i} style={[styles.mainTitleChip, { backgroundColor: accentColor + "33", borderColor: accentColor + "88" }]}>
            <Text
              style={[styles.mainTitleText, { color: accentColor }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.5}
            >
              {token.text}
            </Text>
          </View>
        );
      case "subTitle":
        return (
          <View key={i} style={[styles.subTitleChip, { borderColor: accentColor + "55" }]}>
            <Text
              style={[styles.subTitleText, { color: accentColor }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.5}
            >
              {token.text}
            </Text>
          </View>
        );
      case "bullet":
        return (
          <View key={i} style={styles.bulletRow}>
            <Text style={[baseStyle, { color: accentColor }]}>{"•"}</Text>
            <Text style={[baseStyle, styles.bulletText]}>{renderInline(token.text)}</Text>
          </View>
        );
      case "paragraph":
        return <Text key={i} style={baseStyle}>{renderInline(token.text)}</Text>;
    }
  });
}

interface Props {
  title: string;
  accentColor: string;
  aiLabel?: string;
  storageKey: string;
  initialMessages?: ChatMessage[];
  onProcessMessage: (message: ChatSendPayload, history: ChatMessage[]) => Promise<ProcessResult>;
  disclaimer?: string;
  disclaimerSub?: string;
  backTo?: string;
  backLabel?: string;
  speechEnabled?: boolean;
  onTranscribeAudio?: (uri: string) => Promise<string>;
  onCameraPress?: (onImageReady: (imageUri: string) => void) => Promise<CameraInputResult | null>;
  placeholder?: string;
  typingLabel?: string;
  speechErrorMessage?: string;
  autoPrompt?: string;
  messageWarning?: string;
  clearOnLoad?: boolean;
  starterPrompts?: string[];
  conversational?: boolean;
  saveable?: boolean;
  saveCategory?: DocCategory;
}

export function ChatScreen({
  title: _title,
  accentColor,
  aiLabel = "AI",
  storageKey,
  initialMessages = [],
  onProcessMessage,
  disclaimer,
  disclaimerSub: _disclaimerSub,
  backTo,
  backLabel,
  speechEnabled: _speechEnabled = false,
  onTranscribeAudio = whisperTranscribe,
  onCameraPress,
  placeholder = "Type your message...",
  typingLabel = "Typing...",
  speechErrorMessage = "I couldn't hear you. Please try again.",
  autoPrompt,
  messageWarning,
  clearOnLoad = false,
  starterPrompts,
  conversational = false,
  saveable = false,
  saveCategory = "general",
}: Props) {
  const { profile } = useUserProfile();
  const userFirstName = profile.name.trim().split(" ")[0] || "You";
  const { addDoc, upsertDocByTitle } = useDocs();
  const { addAlert } = useAlerts();
  const [saveTarget, setSaveTarget] = useState<{ text: string; suggestedTitle: string } | null>(null);
  const [saveTitle, setSaveTitle] = useState("");
  const pendingOfferRef = useRef<{ title: string; content: string } | null>(null);

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

    (async () => {
      const existing = messagesRef.current;
      const userMessage: ChatMessage = { role: "user", text: autoPrompt, timestamp: now() };
      let base = [...existing, userMessage];
      setMessages(base);
      setTyping(true);

      let textForAI = autoPrompt;
      const tr = await translateToEnglish(autoPrompt);
      if (tr.needed && tr.translated) {
        const translatedMessage: ChatMessage = {
          role: "user",
          text: tr.translated,
          timestamp: now(),
          isTranslation: true,
        };
        base = [...base, translatedMessage];
        setMessages(base);
        textForAI = tr.translated;
      }

      const result = await onProcessMessage({ text: textForAI }, settings.useHistory ? existing : []);
      const { clean: cleanAiText, offerTitle } = stripSaveMarker(result.aiText);
      if (saveable && offerTitle && !result.isError) {
        pendingOfferRef.current = { title: offerTitle, content: cleanAiText };
      }
      const aiMessage: ChatMessage = { role: "ai", text: cleanAiText, isError: result.isError, warningText: result.isError ? undefined : resolveWarning(cleanAiText, messageWarning), timestamp: now() };
      const next = [...base, aiMessage];
      setMessages(next);
      if (settings.saveChatHistory) {
        AsyncStorage.setItem(storageKey, JSON.stringify(next));
      }
      setTyping(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    })();
  }, [pendingAutoSend]);

  const buildSuggestedTitle = (text: string): string => {
    const titleMatch = text.match(/^\*\*([^*\n]+)\*\*\s*$/m);
    if (titleMatch) return titleMatch[1].trim();
    const firstLine = text.split("\n").map((l) => l.trim()).find((l) => l.length > 0) || "";
    return firstLine.replace(/[*#:_-]/g, "").slice(0, 60).trim() || "Untitled";
  };

  const openSaveModal = (text: string, suggested?: string) => {
    const title = suggested || buildSuggestedTitle(text);
    setSaveTitle(title);
    setSaveTarget({ text, suggestedTitle: title });
  };

  const SAVE_MARKER_RE = /\n?\s*\[OFFER_SAVE:\s*title\s*=\s*"([^"]+)"\s*\]\s*$/i;
  const stripSaveMarker = (raw: string): { clean: string; offerTitle?: string } => {
    const m = raw.match(SAVE_MARKER_RE);
    if (!m) return { clean: raw };
    return { clean: raw.slice(0, m.index!).trimEnd(), offerTitle: m[1].trim() };
  };

  const SAVE_AFFIRMATIVE = /^(yes|yeah|yep|yup|ok|okay|sure|please|please save|do it|do save|save it|save this|save that|save them|save those|save these|save please)\b/i;
  const SAVE_COMMAND = /\bsave (it|this|that|them|those|these)\b/i;
  const detectSaveIntent = (text: string): boolean => {
    const t = text.trim();
    if (!t) return false;
    if (pendingOfferRef.current && SAVE_AFFIRMATIVE.test(t)) return true;
    return SAVE_COMMAND.test(t) || /^(save|please save)\b/i.test(t);
  };

  const cancelSave = () => {
    setSaveTarget(null);
    setSaveTitle("");
  };

  const confirmSave = () => {
    if (!saveTarget) return;
    const payload = {
      title: saveTitle.trim() || saveTarget.suggestedTitle,
      category: saveCategory,
      content: saveTarget.text,
    };
    // Family + memory entries upsert by title so the AI's full updated record
    // replaces the previous version instead of creating duplicates.
    if (saveCategory === "family" || saveCategory === "memory") {
      upsertDocByTitle(payload);
    } else {
      addDoc(payload);
    }
    addDebugEntry("ChatScreen", "doc_saved", { category: saveCategory, title: saveTitle, storageKey });
    setSaveTarget(null);
    setSaveTitle("");
  };

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

    addDebugEntry("ChatScreen", "user_payload", {
      text: cleanText,
      imageUri: payload.imageUri || "",
      hiddenText: !!payload.hiddenText,
      storageKey,
    });

    if (saveable && cleanText && detectSaveIntent(cleanText)) {
      const offer = pendingOfferRef.current;
      if (offer) {
        openSaveModal(offer.content, offer.title);
      } else {
        const lastAi = [...messages].reverse().find((m) => m.role === "ai" && m.text && !m.isError);
        if (lastAi?.text) openSaveModal(lastAi.text);
      }
      pendingOfferRef.current = null;
    }

    if (cleanText) {
      const flagged = scanKeywords(cleanText)
        .filter((s) => s.kind === "flag")
        .map((s) => s.text);
      if (flagged.length > 0) {
        addAlert({ message: cleanText, keywords: flagged, storageKey });
      }
    }

    const userMessage: ChatMessage = {
      role: "user",
      imageUri: payload.imageUri,
      text: payload.hiddenText || payload.imageUri ? "" : cleanText,
      timestamp: now(),
    };

    let nextWithUser = [...messages, userMessage];
    await persistMessages(nextWithUser);

    setInput("");
    setTyping(true);

    let textForAI = cleanText;
    if (cleanText) {
      const tr = await translateToEnglish(cleanText);
      if (tr.needed && tr.translated) {
        const translatedMessage: ChatMessage = {
          role: "user",
          text: tr.translated,
          timestamp: now(),
          isTranslation: true,
        };
        nextWithUser = [...nextWithUser, translatedMessage];
        await persistMessages(nextWithUser);
        textForAI = tr.translated;
      }
    }

    const result = await onProcessMessage({
      ...payload,
      text: textForAI,
    }, settings.useHistory ? messages : []);

    const { clean: cleanAiText, offerTitle } = stripSaveMarker(result.aiText);
    if (saveable && offerTitle && !result.isError) {
      pendingOfferRef.current = { title: offerTitle, content: cleanAiText };
    }

    const aiMessage: ChatMessage = {
      role: "ai",
      text: cleanAiText,
      isError: result.isError,
      warningText: result.isError ? undefined : resolveWarning(cleanAiText, messageWarning),
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
      text: speechErrorMessage,
      isError: true,
      timestamp: now(),
    };
    setMessages((prev) => [...prev, errorMessage]);
    clearSpeechError();
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [speechError]);

  const handleMicPress = async () => {
    clearSpeechError();

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
                    <Text style={styles.userLabel}>
                      {m.isTranslation ? `${userFirstName} · Translated to English` : userFirstName}
                    </Text>
                    {!!m.timestamp && <Text style={styles.timestamp}>{m.timestamp}</Text>}
                  </View>
                  {!!m.imageUri && (
                    <Image source={{ uri: m.imageUri }} style={styles.messageImage} />
                  )}
                  {!!m.text && !m.imageUri && (
                    <View style={styles.userBubbleTextRow}>
                      {scanKeywords(m.text).flatMap((seg, j) => {
                        if (seg.kind === "flag") {
                          return [
                            <View key={`f${j}`} style={styles.flagPill}>
                              <Text style={styles.flagPillText}>{seg.text}</Text>
                            </View>,
                          ];
                        }
                        return seg.text
                          .split(/(\s+)/)
                          .filter((w) => w.length > 0 && !/^\s+$/.test(w))
                          .map((w, k) => (
                            <Text key={`t${j}-${k}`} style={styles.userBubbleText}>
                              {w}
                            </Text>
                          ));
                      })}
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            )
          )}

          {typing && (
            <View style={styles.aiBubbleWrap}>
              <View style={styles.aiBubble}>
                <Text style={[styles.aiLabel, { color: accentColor }]}>{aiLabel}</Text>
                <Text style={styles.messageText}>{typingLabel}</Text>
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

        <MessageReaderModal
          visible={readerPair !== null}
          messages={readerPair || []}
          accentColor={accentColor}
          onClose={() => setReaderPair(null)}
        />

        <Modal
          visible={saveTarget !== null}
          transparent
          animationType="fade"
          onRequestClose={cancelSave}
        >
          <View style={styles.saveOverlay}>
            <View style={styles.saveCard}>
              <Text style={styles.saveTitleHeading}>Save to Docs</Text>
              <Text style={styles.saveSubtle}>Give this a title so you can find it later.</Text>
              <TextInput
                value={saveTitle}
                onChangeText={setSaveTitle}
                placeholder="Title"
                placeholderTextColor={colors.textCaption}
                style={styles.saveInput}
                autoFocus
              />
              <View style={styles.saveBtnRow}>
                <TouchableOpacity onPress={cancelSave} style={styles.saveCancelBtn}>
                  <Text style={styles.saveCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={confirmSave} style={[styles.saveConfirmBtn, { backgroundColor: accentColor }]}>
                  <Text style={styles.saveConfirmText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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

  userBubbleTextRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    columnGap: 4,
    rowGap: 4,
  },
  flagPill: {
    backgroundColor: colors.destructive,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  flagPillText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
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
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1.5,
  },

  fullscreenHintText: {
    fontSize: 13,
    fontWeight: "700",
  },

  saveOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  saveCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 22,
    gap: 12,
  },
  saveTitleHeading: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
  },
  saveSubtle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  saveInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 16,
  },
  saveBtnRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  saveCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  saveCancelText: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: "600",
  },
  saveConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  saveConfirmText: {
    color: colors.background,
    fontSize: 16,
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
    color: colors.destructive,
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
    color: colors.destructive,
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