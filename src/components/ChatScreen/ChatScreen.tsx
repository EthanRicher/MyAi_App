import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useUserProfile } from "../../profile/hooks/useUserProfile";
import { usePulseLoop } from "../../hooks/usePulseLoop";
import { useSaveFlow } from "../../hooks/useSaveFlow";
import { useAlerts } from "../../features/Docs/hooks/useAlerts";
import { useAISettings } from "../../hooks/useAISettings";
import { useSpeechInput } from "../../backend/1_Input/Speech/Input_SpeechHook";
import { whisperTranscribe } from "../../backend/1_Input/Speech/Input_Whisper";
import { runChecks } from "../../backend/2_Checks";
import { debugLog, debugTurn, debugTurnEnd } from "../../backend/_AI/AI_Debug";

import { BackButton } from "../BackButton";
import { MessageReaderModal, ReaderMessage } from "../MessageReaderModal";

import type { ChatMessage, ChatScreenProps, ChatSendPayload } from "./types";
import { isBreakdown, now, resolveWarning } from "./helpers";
import { styles } from "./styles";
import { AiBubble } from "./bubbles/AiBubble";
import { UserBubble } from "./bubbles/UserBubble";
import { SaveOfferBubble } from "./bubbles/SaveOfferBubble";
import { TypingBubble } from "./bubbles/TypingBubble";
import { StarterPrompts } from "./StarterPrompts";
import { BottomControls } from "./BottomControls";
import { SaveModal } from "./SaveModal";

/**
 * The main chat surface. Owns the transcript, persistence, the speech
 * loop, the auto-prompt kick-off, the safety checks and the save
 * flow, then composes the visual pieces around all of that. Feature
 * screens (Companion, Clarity, MedView) just hand in their accent
 * colour, callbacks and disclaimer copy.
 */

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
}: ChatScreenProps) {
  // Identity bits. First name for the bubble label, alerts hook for flagged messages.
  const { profile } = useUserProfile();
  const userFirstName = profile.name.trim().split(" ")[0] || "You";
  const { addAlert } = useAlerts();

  /**
   * Save to Docs state machine. Tracks the modal, the suggested
   * title, the pending offer (so a "yes save" reply still works
   * after the offer card has scrolled past) and the silent upsert
   * path used for Family / Memory.
   */
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

  // Transcript and UI state. messagesRef mirrors messages so async callbacks always read the latest.
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);
  const [pendingAutoSend, setPendingAutoSend] = useState(false);
  const [readerPair, setReaderPair] = useState<ReaderMessage[] | null>(null);

  const messagesRef = useRef<ChatMessage[]>([]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const { settings } = useAISettings();

  /**
   * Reader modal. Works out what to show when a bubble is tapped.
   * In conversational chats we pair the user prompt with the AI
   * reply so it reads like a quoted exchange, but for structured
   * breakdowns we just show the bubble on its own.
   */
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

  /**
   * Initial load. Honours the clear-on-load and clear-on-exit
   * settings, then either restores a saved transcript or falls
   * back to the initial messages. Queues the auto-prompt for the
   * next render so it fires after the transcript is in place.
   */
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

  // Wipe the saved transcript on unmount when the user has opted in.
  useEffect(() => {
    return () => {
      if (settings.clearOnExit) {
        AsyncStorage.removeItem(storageKey);
      }
    };
  }, [storageKey, settings.clearOnExit]);

  /**
   * Auto-prompt kick-off. Fires once after the transcript loads.
   * Mirrors the normal send pipeline but skips the safety alert
   * path because the prompt is system-generated, not user-typed.
   */
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
      const aiMessage: ChatMessage = {
        role: "ai",
        text: result.aiText,
        isError: result.isError,
        warningText: result.isError ? undefined : resolveWarning(result.aiText, messageWarning),
        timestamp: now(),
      };
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

  // Update state and (optionally) write to storage in one call.
  const persistMessages = async (nextMessages: ChatMessage[]) => {
    setMessages(nextMessages);
    if (settings.saveChatHistory) {
      await AsyncStorage.setItem(storageKey, JSON.stringify(nextMessages));
    }
  };

  /**
   * Core send pipeline. Handles the save-affirmative shortcut,
   * appends the user bubble, runs the safety and translation
   * checks, calls the AI, then appends the reply (and a save-offer
   * bubble when applicable).
   */
  const sendPayload = async (payload: ChatSendPayload) => {
    const cleanText = payload.text?.trim() || "";
    const hasImage = !!payload.imageUri;

    if (!cleanText && !hasImage) return;

    debugTurn();
    debugLog("ChatScreen", "Action", "User submitted", {
      chars: cleanText.length,
      hasImage: !!payload.imageUri,
    });

    /**
     * Save-affirmative shortcut. If the user replies with "yes
     * save" or "save it", reroute to the save modal instead of
     * sending another full AI turn. Falls back to the most recent
     * AI reply when no pending offer is on file.
     */
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

    // Save-affirmative. Skip the AI call. Modal is already open, just acknowledge.
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

    // Safety and translation, then the AI call.
    let textForAI = cleanText;
    if (cleanText) {
      const checks = await runChecks({ text: cleanText });

      /**
       * Two-layer flag detection. The keyword scan is deterministic
       * and covers original plus translated text, the AI second-pass
       * catches paraphrased urgency the keyword list misses. Either
       * layer firing logs an alert; carers see both signals when
       * both matched.
       */
      if (checks.flaggedWords.length > 0 || checks.flaggedReason) {
        addAlert({
          message: cleanText,
          keywords: checks.flaggedWords,
          reason: checks.flaggedReason,
          storageKey,
        });
      }

      // AI-only flag. Paint the user bubble with the soft orange treatment.
      const aiOnlyFlag = !!checks.flaggedReason && checks.flaggedWords.length === 0;
      if (aiOnlyFlag) {
        nextWithUser = nextWithUser.map((m) =>
          m === userMessage ? { ...userMessage, aiFlagged: true } : m
        );
        await persistMessages(nextWithUser);
      }

      // Translation. If the message wasn't English, append the translated copy and use it for the AI.
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

    /**
     * Save-offer routing. Passive categories (Family, Memory) get
     * upserted silently; active ones get a save-offer bubble
     * appended after the AI reply.
     */
    let offerForChat: NonNullable<ChatMessage["saveOffer"]> | null = null;
    if (saveable && result.saveOffer && !result.isError) {
      const so = result.saveOffer;
      if (so.autoSave && saveCategory) {
        passiveUpsert(so.suggestedTitle, so.cleanContent);
        pendingOfferRef.current = null;
      } else if (so.offerSentence) {
        // Set the pending ref so a later "yes save" still works, and queue the offer card.
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
        { role: "ai", saveOffer: offerForChat, timestamp: now() },
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

  // Speech input. Wraps the mic and transcription. Transcripts go through the normal send pipeline.
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

  // Soft red breathing pulse on the record button while recording.
  const recordPulse = usePulseLoop(isRecording);

  // Surface speech errors as a fake AI error bubble so the user stays in the same flow.
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

  // Bottom-control handlers.
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

  /**
   * Camera path. The parent screen owns the camera UI and hands
   * back an image plus OCR text. We optimistically append a
   * preview bubble while the camera is open so the photo shows up
   * straight away, then send the real payload once the result
   * lands.
   */
  const handlePhotoPress = async () => {
    clearSpeechError();
    if (!onCameraPress) return;

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

      if (!result) return;

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
        {/* Header. Back on the left, clear-chat on the right. */}
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

        {/* Optional disclaimer banner. Feature-specific safety copy. */}
        {!!disclaimer && (
          <View style={[styles.disclaimerBanner, { backgroundColor: accentColor + "18", borderBottomColor: accentColor + "55" }]}>
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} style={[styles.disclaimerBannerTitle, { color: accentColor }]}>{disclaimer}</Text>
          </View>
        )}

        {/* Transcript. Empty-state prompts when blank, then the bubbles, then the typing placeholder. */}
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.messages}
          onContentSizeChange={() =>
            scrollRef.current?.scrollToEnd({ animated: true })
          }
        >
          {messages.length === 0 && !typing && settings.showStarterPrompts && starterPrompts && starterPrompts.length > 0 && (
            <StarterPrompts
              prompts={starterPrompts}
              accentColor={accentColor}
              onSelect={(prompt) => sendPayload({ text: prompt })}
            />
          )}

          {messages.map((m, i) => {
            if (m.saveOffer) {
              return (
                <SaveOfferBubble
                  key={i}
                  message={m as ChatMessage & { saveOffer: NonNullable<ChatMessage["saveOffer"]> }}
                  accentColor={accentColor}
                  aiLabel={aiLabel}
                  onSave={(content, title) => openSaveModal(content, title)}
                />
              );
            }
            if (m.role === "ai") {
              return (
                <AiBubble
                  key={i}
                  message={m}
                  accentColor={accentColor}
                  aiLabel={aiLabel}
                  onOpenReader={() => openReader(i)}
                />
              );
            }
            return (
              <UserBubble
                key={i}
                message={m}
                userFirstName={userFirstName}
                onOpenReader={() => openReader(i)}
              />
            );
          })}

          {typing && (
            <TypingBubble accentColor={accentColor} aiLabel={aiLabel} typingLabel={typingLabel} />
          )}
        </ScrollView>

        {/* Bottom dock. Record / type / photo, or the text input row. */}
        <View
          style={[
            styles.bottomWrap,
            { paddingBottom: insets.bottom + 4 },
          ]}
        >
          <BottomControls
            accentColor={accentColor}
            isRecording={isRecording}
            recordPulse={recordPulse}
            onMicPress={handleMicPress}
            showTextInput={showTextInput}
            onOpenText={handleOpenText}
            onCloseText={handleCloseText}
            input={input}
            onChangeInput={setInput}
            onSendText={() => sendPayload({ text: input })}
            placeholder={placeholder}
            onPhotoPress={onCameraPress ? handlePhotoPress : undefined}
            hasCamera={!!onCameraPress}
          />
        </View>

        {/* Full-screen reader. Large-text view of one bubble, or a paired exchange. */}
        <MessageReaderModal
          visible={readerPair !== null}
          messages={readerPair || []}
          accentColor={accentColor}
          onClose={() => setReaderPair(null)}
        />

        {/* Save to Docs dialog. Pre-filled with the suggested title. */}
        <SaveModal
          visible={saveTarget !== null}
          accentColor={accentColor}
          saveTitle={saveTitle}
          onChangeTitle={setSaveTitle}
          onCancel={cancelSave}
          onConfirm={confirmSave}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
