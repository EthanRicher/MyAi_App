import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Mic, Settings, LogOut, ArrowRight } from "lucide-react-native";
import { RootStackParamList } from "../navigation/AppNavigator";
import { colors } from "../theme";
import { useSpeechInput } from "../ai/speech/useSpeechInput";
import { whisperTranscribe } from "../ai/speech/whisperTranscriber";
import { runAI } from "../ai/core/runAI";
import { mainDashboardTriage } from "../ai/scopes/mainDashboardTriage";

type Nav = NativeStackNavigationProp<RootStackParamList, "Main">;

type TriageResult = {
  transcript: string;
  reply: string;
  route: keyof RootStackParamList;
  routeLabel: string;
};

const RECORD_LIMIT = 5; // seconds
const BTN_SIZE = 160;

export function MainDashboard() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<TriageResult | null>(null);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(RECORD_LIMIT);

  const timerAnim = useRef(new Animated.Value(0)).current;
  const timerAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const timerRotate = timerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const handleTranscript = async (transcript: string) => {
    setIsProcessing(true);
    setError("");
    setResult(null);

    try {
      const aiResult = await runAI({ text: transcript, scope: mainDashboardTriage });

      if (aiResult.error) {
        setError("Sorry, I couldn't understand that. Please try again.");
        return;
      }

      const output = aiResult.output;
      setResult({
        transcript,
        reply: output.reply,
        route: output.route as keyof RootStackParamList,
        routeLabel: output.routeLabel,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const { isRecording, speechError, startRecording, stopRecording } =
    useSpeechInput({
      transcribe: whisperTranscribe,
      onTranscript: handleTranscript,
    });

  // Start/stop countdown + timer animation when recording state changes
  useEffect(() => {
    if (isRecording) {
      setCountdown(RECORD_LIMIT);
      timerAnim.setValue(0);

      timerAnimRef.current = Animated.timing(timerAnim, {
        toValue: 1,
        duration: RECORD_LIMIT * 1000,
        useNativeDriver: true,
      });
      timerAnimRef.current.start();

      intervalRef.current = setInterval(() => {
        setCountdown((s) => s - 1);
      }, 1000);

      autoStopRef.current = setTimeout(() => {
        stopRecording();
      }, RECORD_LIMIT * 1000);
    } else {
      timerAnimRef.current?.stop();
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (autoStopRef.current) clearTimeout(autoStopRef.current);
      timerAnim.setValue(0);
      setCountdown(RECORD_LIMIT);
    }
  }, [isRecording]);

  const handleRecordPress = () => {
    setResult(null);
    setError("");
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const displayError = error || speechError;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 12 }]}>

      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.replace("Splash")}
          style={styles.topBtn}
          accessibilityLabel="Logout"
        >
          <LogOut size={24} color="#F44336" />
          <Text style={[styles.topBtnText, { color: "#F44336" }]}>Logout</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate("Settings")}
          style={styles.topBtn}
          accessibilityLabel="Settings"
        >
          <Settings size={24} color={colors.textMuted} />
          <Text style={[styles.topBtnText, { color: colors.textMuted }]}>Settings</Text>
        </TouchableOpacity>
      </View>

      {/* ── Greeting ── */}
      <View style={styles.greetingZone}>
        <Text style={styles.greeting}>Hello, Margaret</Text>
        <View style={styles.subRow}>
          {displayError ? (
            <View style={styles.errorBadge}>
              <Text style={styles.errorBadgeText}>Sorry, I didn't catch that. Try again</Text>
            </View>
          ) : (
            <Text style={styles.sub}>
              {isRecording
                ? "Recording..."
                : isProcessing
                ? "Processing your request…"
                : "Tap to tell me what you need"}
            </Text>
          )}
        </View>
      </View>

      {/* ── Record button ── */}
      <View style={styles.buttonZone}>
        <View style={styles.btnWrapper}>
          {isRecording && (
            <Animated.View
              style={[styles.timerRing, { transform: [{ rotate: timerRotate }] }]}
              pointerEvents="none"
            />
          )}
          <TouchableOpacity
            onPress={handleRecordPress}
            disabled={isProcessing}
            style={[
              styles.recordBtn,
              isRecording && styles.recordBtnActive,
              isProcessing && styles.recordBtnDisabled,
            ]}
            accessibilityLabel={isRecording ? "Tap to stop recording" : "Tap to record"}
          >
            {isProcessing ? (
              <ActivityIndicator size="large" color={colors.text} />
            ) : (
              <Mic size={52} color={colors.text} strokeWidth={2.5} />
            )}
            <Text style={styles.recordLabel}>
              {isProcessing ? "Thinking..." : isRecording ? String(countdown) : "Record"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Explore Features ── */}
      <TouchableOpacity
        onPress={() => navigation.navigate("Home")}
        style={[styles.exploreBtn, (isRecording || isProcessing) && styles.exploreBtnDisabled]}
        disabled={isRecording || isProcessing}
        accessibilityLabel="Explore features"
      >
        <Text style={[styles.exploreBtnText, (isRecording || isProcessing) && styles.exploreBtnTextDisabled]}>
          Explore Features
        </Text>
      </TouchableOpacity>

      {/* ── Fixed content box — examples or result ── */}
      <View style={styles.contentBox}>
        {result ? (
          <>
            <Text style={styles.transcriptLabel}>You said:</Text>
            <Text style={styles.transcriptText}>"{result.transcript}"</Text>
            <Text style={styles.replyText}>{result.reply}</Text>
            <TouchableOpacity
              style={styles.navBtn}
              onPress={() => navigation.navigate(result.route as any)}
              accessibilityLabel={`Go to ${result.routeLabel}`}
            >
              <Text style={styles.navBtnText}>Go to {result.routeLabel}</Text>
              <ArrowRight size={20} color={colors.background} strokeWidth={2.5} />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.suggestionsLabel}>You could ask me...</Text>
            {[
              "What's my next pill?",
              "I'm not feeling well",
              "Explain my prescription",
            ].map((q) => (
              <View key={q} style={styles.suggestionBubble}>
                <Text style={styles.suggestionText}>{q}</Text>
              </View>
            ))}
          </>
        )}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
  },

  // ── Top bar ──────────────────────────────────────────────
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 8,
  },
  topBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  topBtnText: {
    fontSize: 18,
    fontWeight: "600",
  },

  // ── Greeting ─────────────────────────────────────────────
  greetingZone: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 0,
    gap: 6,
  },
  greeting: {
    color: colors.text,
    fontSize: 36,
    fontWeight: "700",
    textAlign: "center",
  },
  sub: {
    color: colors.textMuted,
    fontSize: 22,
    textAlign: "center",
  },
  subRow: {
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Error badge ───────────────────────────────────────────
  errorBadge: {
    borderWidth: 1,
    borderColor: "#E53935",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: "#1a0505",
    alignItems: "center",
    justifyContent: "center",
  },
  errorBadgeText: {
    color: "#FF8A80",
    fontSize: 16,
    textAlign: "center",
  },

  // ── Record button ─────────────────────────────────────────
  buttonZone: {
    alignItems: "center",
    paddingTop: 30,
  },
  recordBtn: {
    width: BTN_SIZE,
    height: BTN_SIZE,
    borderRadius: BTN_SIZE / 2,
    backgroundColor: "#E53935",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#E53935",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 10,
  },
  recordBtnActive: {
    backgroundColor: "#B71C1C",
    shadowOpacity: 0.8,
    shadowRadius: 40,
  },
  recordBtnDisabled: {
    backgroundColor: "#555",
    shadowOpacity: 0.1,
  },
  recordLabel: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "700",
  },

  // ── Timer ring ────────────────────────────────────────────
  btnWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  timerRing: {
    position: "absolute",
    width: BTN_SIZE + 20,
    height: BTN_SIZE + 20,
    borderRadius: (BTN_SIZE + 20) / 2,
    borderWidth: 5,
    borderColor: "transparent",
    borderTopColor: "rgba(255,255,255,0.9)",
    borderRightColor: "rgba(255,255,255,0.9)",
  },

  // ── Explore Features ──────────────────────────────────────
  exploreBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: "center",
    marginTop: 36,
  },
  exploreBtnText: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: "700",
  },
  exploreBtnDisabled: {
    borderColor: colors.textCaption,
  },
  exploreBtnTextDisabled: {
    color: colors.textCaption,
  },

  // ── Content box ───────────────────────────────────────────
  contentBox: {
    flex: 1,
    marginTop: 16,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    justifyContent: "space-between",
  },
  transcriptLabel: {
    color: colors.textCaption,
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  transcriptText: {
    color: colors.textMuted,
    fontSize: 16,
    fontStyle: "italic",
  },
  replyText: {
    color: colors.text,
    fontSize: 18,
    lineHeight: 26,
  },
  navBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  navBtnText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: "700",
  },

  // ── Suggestions ───────────────────────────────────────────
  suggestionsLabel: {
    color: colors.textCaption,
    fontSize: 18,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  suggestionBubble: {
    backgroundColor: "#13133a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#5a5a7a",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  suggestionText: {
    color: colors.text,
    fontSize: 20,
  },
});
