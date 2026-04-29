import { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Mic } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackButton } from "../../../components/BackButton";
import { colors } from "../../../theme";
import { useSpeechInput } from "../../../input/speech/useSpeechInput";
import { whisperTranscribe } from "../../../input/speech/whisperTranscriber";
import { runAI } from "../../../ai/core/runAI";
import { extractAIText } from "../../../ai/core/extractAIText";
import { clarityDoctorExplained } from "../../../ai/scopes/clarity/doctorExplained";
import { clarityChatConfigs } from "../../../config/Chat_config";
import { parseMarkdown, parseInline } from "../../../components/markdown";

type Entry = { transcript: string; explanation: string };

const cfg = clarityChatConfigs.clarityDoctorExplained;

const renderInline = (text: string) =>
  parseInline(text).map((seg, j) =>
    seg.kind === "bold"
      ? <Text key={j} style={{ fontWeight: "700" }}>{seg.text}</Text>
      : seg.text
  );

function renderExplanation(text: string) {
  return parseMarkdown(text).map((token, i) => {
    switch (token.kind) {
      case "mainTitle":
      case "subTitle":
        return (
          <Text
            key={i}
            style={styles.explainTitle}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
          >
            {token.text}
          </Text>
        );
      case "bullet":
        return (
          <View key={i} style={styles.bulletRow}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>{renderInline(token.text)}</Text>
          </View>
        );
      case "paragraph":
        return <Text key={i} style={styles.explainBody}>{renderInline(token.text)}</Text>;
    }
  });
}

export function ClarityRecord() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const [entries, setEntries] = useState<Entry[]>([]);
  const [pendingTranscript, setPendingTranscript] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const handleTranscript = async (text: string) => {
    setPendingTranscript(text);
    setIsProcessing(true);
    setError("");
    try {
      const result = await runAI({ text, scope: clarityDoctorExplained });
      if (result.error) {
        setError(cfg.errorMessage);
        setPendingTranscript(null);
        return;
      }
      const explanation = extractAIText(result, "");
      setEntries((prev) => [...prev, { transcript: text, explanation }]);
      setPendingTranscript(null);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } finally {
      setIsProcessing(false);
    }
  };

  const { isRecording, speechError, startRecording, stopRecording } = useSpeechInput({
    transcribe: whisperTranscribe,
    onTranscript: handleTranscript,
  });

  const handlePress = () => {
    if (isRecording) {
      stopRecording();
    } else {
      setError("");
      startRecording();
    }
  };

  const displayError = error || speechError;
  const label = isProcessing ? "Simplifying..." : isRecording ? "Tap to stop" : "Tap to Record";

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 12 }]}>
      <BackButton label={cfg.backLabel} to={cfg.backTo} />

      <View style={styles.micSection}>
        <TouchableOpacity
          onPress={handlePress}
          disabled={isProcessing}
          style={[
            styles.micCircle,
            isRecording && styles.micCircleActive,
            isProcessing && styles.micCircleDisabled,
          ]}
          accessibilityLabel={isRecording ? "Stop recording" : "Start recording"}
        >
          {isProcessing ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <Mic size={40} color={isRecording ? colors.text : colors.primary} />
          )}
        </TouchableOpacity>
        <Text style={styles.label}>{label}</Text>
        {displayError ? <Text style={styles.error}>{displayError}</Text> : null}
      </View>

      <ScrollView ref={scrollRef} style={styles.chat} contentContainerStyle={styles.chatContent}>
        {entries.map((entry, i) => (
          <View key={i} style={styles.entryBlock}>
            <View style={styles.transcriptBubble}>
              <Text style={styles.bubbleLabel}>What was said</Text>
              <Text style={styles.transcriptText}>{entry.transcript}</Text>
            </View>
            <View style={styles.explanationBubble}>
              <Text style={styles.bubbleLabel}>Plain language</Text>
              {renderExplanation(entry.explanation)}
            </View>
          </View>
        ))}

        {pendingTranscript && (
          <View style={styles.entryBlock}>
            <View style={styles.transcriptBubble}>
              <Text style={styles.bubbleLabel}>What was said</Text>
              <Text style={styles.transcriptText}>{pendingTranscript}</Text>
            </View>
            <View style={[styles.explanationBubble, styles.explanationPending]}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          </View>
        )}

        {entries.length === 0 && !pendingTranscript && (
          <Text style={styles.emptyHint}>
            Record a conversation and it will appear here, explained in plain language.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  micSection: { alignItems: "center", paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16, gap: 10 },
  micCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: colors.primary,
    backgroundColor: colors.primary + "1A",
    alignItems: "center",
    justifyContent: "center",
  },
  micCircleActive: { borderColor: colors.destructive, backgroundColor: colors.destructive + "26" },
  micCircleDisabled: { borderColor: colors.border, backgroundColor: colors.card },
  label: { color: colors.text, fontSize: 20, fontWeight: "700" },
  error: { color: colors.destructive, fontSize: 15, textAlign: "center" },
  chat: { flex: 1 },
  chatContent: { paddingHorizontal: 16, paddingBottom: 16, gap: 20 },
  emptyHint: { color: colors.textMuted, fontSize: 15, textAlign: "center", lineHeight: 22, marginTop: 24, paddingHorizontal: 16 },
  entryBlock: { gap: 10 },
  transcriptBubble: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderTopRightRadius: 4,
    padding: 14,
    gap: 6,
    alignSelf: "flex-end",
    maxWidth: "90%",
  },
  explanationBubble: {
    backgroundColor: colors.primary + "14",
    borderWidth: 1,
    borderColor: colors.primary + "33",
    borderRadius: 14,
    borderTopLeftRadius: 4,
    padding: 14,
    gap: 8,
    alignSelf: "flex-start",
    maxWidth: "90%",
  },
  explanationPending: { paddingVertical: 18, alignItems: "center", minWidth: 60 },
  bubbleLabel: { color: colors.textMuted, fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  transcriptText: { color: colors.text, fontSize: 15, lineHeight: 22 },
  explainTitle: { color: colors.primary, fontSize: 15, fontWeight: "800" },
  explainBody: { color: colors.text, fontSize: 15, lineHeight: 22 },
  bulletRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  bulletDot: { color: colors.primary, fontSize: 15, lineHeight: 22 },
  bulletText: { flex: 1, color: colors.text, fontSize: 15, lineHeight: 22 },
});
