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
  Animated,
} from "react-native";
import { usePulseLoop } from "../hooks/usePulseLoop";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AI_WARNING } from "../backend/3_Scopes/_Common/Scope_Common_Warnings";
import { Camera, Send, Mic, X, Keyboard } from "lucide-react-native";
import { BackButton } from "./BackButton";
import { MessageReaderModal, ReaderMessage } from "./MessageReaderModal";
import { renderMarkdownWith, parseInline } from "../backend/6_Present/Present_Markdown";
import { scanKeywords } from "../backend/2_Checks/Text/B_Check_Keywords";
import { runChecks } from "../backend/2_Checks";
import { colors, warningColors, chatBubble, chatActionColors } from "../theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSpeechInput } from "../backend/1_Input/Speech/Input_SpeechHook";
import { whisperTranscribe } from "../backend/1_Input/Speech/Input_Whisper";
import { debugLog, debugTurn, debugTurnEnd } from "../backend/_AI/AI_Debug";
import { useSaveFlow } from "../hooks/useSaveFlow";
import { useAlerts } from "../features/Docs/hooks/useAlerts";
import { DocCategory } from "../features/Docs/models/Doc";
import { useAISettings } from "../hooks/useAISettings";

export interface ChatMessage {
  role: "ai" | "user";
  text?: string;
  imageUri?: string;
  isError?: boolean;
  warningText?: string;
  timestamp?: string;
  isTranslation?: boolean;
  // Set when the AI second-pass safety check flags the message but the
  // hardcoded keyword scan did NOT match. Used to paint the bubble with
  // a softer (orange) flag so carers can see both signals visually.
  aiFlagged?: boolean;
  // When set, this AI message is the save-offer card. The bubble renders
  // the `sentence` plus a Tap to Save button that uses `title` + `content`.
  saveOffer?: { title: string; content: string; sentence: string };
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
  saveOffer?: {
    suggestedTitle: string;
    cleanContent: string;
    /** Set when the offer should appear as its own bubble with a Tap to Save button. */
    offerSentence?: string;
    /** Set for passive categories (Family, Memory) — upsert silently in background. */
    autoSave?: boolean;
  };
}

const renderInline = (text: string) =>
  parseInline(text).map((seg, j) =>
    seg.kind === "bold"
      ? <Text key={j} style={{ fontWeight: "700" }}>{seg.text}</Text>
      : seg.text
  );

function renderMessageContent(text: string, accentColor: string, baseStyle: object) {
  return renderMarkdownWith(text, {
    mainTitle: (token, i) => (
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
    ),
    subTitle: (token, i) => (
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
    ),
    bullet: (token, i) => (
      <View key={i} style={styles.bulletRow}>
        <Text style={[baseStyle, { color: accentColor }]}>{"•"}</Text>
        <Text style={[baseStyle, styles.bulletText]}>{renderInline(token.text)}</Text>
      </View>
    ),
    paragraph: (token, i) => (
      <Text key={i} style={baseStyle}>{renderInline(token.text)}</Text>
    ),
  });
}

interface Props {
  accentColor: string;
  aiLabel?: string;
  storageKey: string;
  initialMessages?: ChatMessage[];
  onProcessMessage: (message: ChatSendPayload, history: ChatMessage[]) => Promise<ProcessResult>;
  disclaimer?: string;
  backTo?: string;
  backLabel?: string;
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
  accentColor,
  aiLabel = "AI",
  storageKey,
  initialMessages = [],
  onProcessMessage,
  disclaimer,
  backTo,
  backLabel,
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
  saveCategory,
}: Props) {
  const { profile } = useUserProfile();
  const userFirstName = profile.name.trim().split(" ")[0] || "You";
  const { addAlert } = useAlerts();
  const {
    saveTarget,
    saveTitle,
    setSaveTitle,
    pendingOfferRef,
    openSaveModal,
    cancelSave,
    confirmSave,
    passiveUpsert,
    detectSaveIntent,
  } = useSaveFlow(saveCategory);

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
      debugTurn();
      debugLog("ChatScreen", "Action", "Auto-prompt sent", { chars: autoPrompt.length });
      const existing = messagesRef.current;
      const userMessage: ChatMessage = { role: "user", text: autoPrompt, timestamp: now() };
      let base = [...existing, userMessage];
      setMessages(base);
      setTyping(true);

      let textForAI = autoPrompt;
      const checks = await runChecks({ text: autoPrompt });
      const tr = checks.translation;
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
      if (saveable && result.saveOffer && !result.isError) {
        pendingOfferRef.current = { title: result.saveOffer.suggestedTitle, content: result.saveOffer.cleanContent };
      }
      const aiMessage: ChatMessage = { role: "ai", text: result.aiText, isError: result.isError, warningText: result.isError ? undefined : resolveWarning(result.aiText, messageWarning), timestamp: now() };
      const next = [...base, aiMessage];
      setMessages(next);
      if (settings.saveChatHistory) {
        AsyncStorage.setItem(storageKey, JSON.stringify(next));
      }
      setTyping(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      debugTurnEnd();
    })();
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

    debugTurn();
    debugLog("ChatScreen", "Action", "User submitted", {
      chars: cleanText.length,
      hasImage: !!payload.imageUri,
    });

    let saveIntentHandled = false;
    if (saveable && cleanText && detectSaveIntent(cleanText)) {
      const offer = pendingOfferRef.current;
      if (offer) {
        openSaveModal(offer.content, offer.title);
        saveIntentHandled = true;
      } else {
        const lastAi = [...messages].reverse().find((m) => m.role === "ai" && m.text && !m.isError);
        if (lastAi?.text) {
          openSaveModal(lastAi.text);
          saveIntentHandled = true;
        }
      }
      pendingOfferRef.current = null;
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

    // Save-affirmative shortcut: skip the AI call entirely. The save modal
    // is already open, so the assistant just acknowledges and asks if there's
    // anything else, instead of producing another full chat reply.
    if (saveIntentHandled) {
      const aiMessage: ChatMessage = {
        role: "ai",
        text: "Was there anything else?",
        timestamp: now(),
      };
      const nextWithAi = [...nextWithUser, aiMessage];
      await persistMessages(nextWithAi);
      debugLog("ChatScreen", "Result", "Save-intent reply persisted");
      debugTurnEnd();
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return;
    }

    setTyping(true);

    let textForAI = cleanText;
    if (cleanText) {
      const checks = await runChecks({ text: cleanText });

      // Two-layer flag detection: hardcoded keyword scan (deterministic,
      // covers original + translated) AND an AI second-pass that catches
      // paraphrased urgency the keyword list misses. Either layer firing
      // is enough to log an alert; the carer sees both signals when both
      // matched. Original text is logged so the carer sees what the user
      // actually typed.
      if (checks.flaggedWords.length > 0 || checks.flaggedReason) {
        addAlert({
          message: cleanText,
          keywords: checks.flaggedWords,
          reason: checks.flaggedReason,
          storageKey,
        });
      }

      // AI-only flag (no hardcoded keyword match) → paint the user bubble
      // with the softer orange treatment so the carer can see the AI
      // caught something the word list didn't.
      const aiOnlyFlag = !!checks.flaggedReason && checks.flaggedWords.length === 0;
      if (aiOnlyFlag) {
        nextWithUser = nextWithUser.map((m) =>
          m === userMessage ? { ...userMessage, aiFlagged: true } : m
        );
        await persistMessages(nextWithUser);
      }

      const tr = checks.translation;
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

    let offerForChat: NonNullable<ChatMessage["saveOffer"]> | null = null;
    if (saveable && result.saveOffer && !result.isError) {
      const so = result.saveOffer;
      // Passive flow: silently upsert in the background and DON'T add an
      // offer card to the chat. Used for Family Tree / Memory Book where the
      // record refines on every turn instead of asking each time.
      if (so.autoSave && saveCategory) {
        passiveUpsert(so.suggestedTitle, so.cleanContent);
        pendingOfferRef.current = null;
      } else if (so.offerSentence) {
        // Offer flow: set pendingOfferRef so a "yes save" affirmative still
        // works AND prepare a separate save-offer message bubble with a
        // Tap to Save button.
        pendingOfferRef.current = { title: so.suggestedTitle, content: so.cleanContent };
        offerForChat = {
          title: so.suggestedTitle,
          content: so.cleanContent,
          sentence: so.offerSentence,
        };
      }
    }

    const aiMessage: ChatMessage = {
      role: "ai",
      text: result.aiText,
      isError: result.isError,
      warningText: result.isError ? undefined : resolveWarning(result.aiText, messageWarning),
      timestamp: now(),
    };

    let nextWithAi = [...nextWithUser, aiMessage];
    if (offerForChat) {
      nextWithAi = [
        ...nextWithAi,
        {
          role: "ai",
          saveOffer: offerForChat,
          timestamp: now(),
        },
      ];
    }
    await persistMessages(nextWithAi);
    setTyping(false);
    debugLog("ChatScreen", "Result", "Reply persisted");
    debugTurnEnd();

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
      await sendPayload({ text });
    },
  });

  // Soft red breathing pulse on the chat record button while recording.
  const recordPulse = usePulseLoop(isRecording);

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
      debugLog("ChatScreen", "Error", "Photo failed", { message: err?.message || "Photo failed" });
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
            m.saveOffer ? (
              <View key={i} style={styles.aiBubbleWrap}>
                <View style={[styles.saveOfferCard, { borderColor: accentColor + "66", backgroundColor: accentColor + "16" }]}>
                  <Text style={[styles.aiLabel, { color: accentColor }]}>{aiLabel}</Text>
                  <Text style={styles.saveOfferText}>{m.saveOffer.sentence}</Text>
                  <TouchableOpacity
                    onPress={() => openSaveModal(m.saveOffer!.content, m.saveOffer!.title)}
                    style={[styles.saveOfferBtn, { backgroundColor: accentColor }]}
                    accessibilityLabel="Tap here to save"
                  >
                    <Text style={[styles.saveOfferBtnText, { color: colors.background }]}>Tap here to save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : m.role === "ai" ? (
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
                  style={[
                    styles.userBubble,
                    m.imageUri && !m.text ? styles.photoBubble : undefined,
                    m.aiFlagged ? styles.userBubbleAiFlagged : undefined,
                  ]}
                  accessibilityHint={m.text ? "Tap to read in full screen" : undefined}
                >
                  <View style={styles.bubbleLabelRow}>
                    <Text style={styles.userLabel}>
                      {m.isTranslation ? `${userFirstName} · Translated to English` : userFirstName}
                    </Text>
                    {m.aiFlagged && (
                      <View style={styles.aiFlagPill}>
                        <Text style={styles.aiFlagPillText}>AI flag</Text>
                      </View>
                    )}
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
                {isRecording && (
                  <Animated.View
                    pointerEvents="none"
                    style={[styles.recordPulseOverlay, { opacity: recordPulse, backgroundColor: chatActionColors.record }]}
                  />
                )}
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

                  {!!onCameraPress && (
                    <TouchableOpacity
                      onPress={handlePhotoPress}
                      style={[styles.actionBtn, { borderColor: chatActionColors.photo, backgroundColor: chatActionColors.photo + "18" }]}
                    >
                      <Camera size={22} color={chatActionColors.photo} />
                      <Text style={[styles.actionText, { color: chatActionColors.photo }]}>
                        Photo
                      </Text>
                    </TouchableOpacity>
                  )}
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
                multiline
                blurOnSubmit
                returnKeyType="done"
                onSubmitEditing={confirmSave}
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
  // Inline save-offer card — its own AI bubble with a tap-to-save action,
  // shown after the assistant produces something save-worthy. Tinted with
  // the chat's accent color so it visually belongs to the AI side.
  saveOfferCard: {
    alignSelf: "stretch",
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    marginVertical: 4,
  },
  saveOfferText: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 22,
  },
  saveOfferBtn: {
    alignSelf: "stretch",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  saveOfferBtnText: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
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
  // AI-only safety flag (orange) — left border on the bubble + a small
  // "AI flag" pill in the label row so the signal is visible without
  // changing how individual flagged keywords (red pills) render in-text.
  userBubbleAiFlagged: {
    borderLeftWidth: 4,
    borderLeftColor: colors.orange,
  },
  aiFlagPill: {
    backgroundColor: colors.orange,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 6,
  },
  aiFlagPillText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.4,
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
    minHeight: 48,
    maxHeight: 140,
    textAlignVertical: "top",
    lineHeight: 22,
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
    overflow: "hidden",
  },
  recordPulseOverlay: {
    ...StyleSheet.absoluteFillObject,
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