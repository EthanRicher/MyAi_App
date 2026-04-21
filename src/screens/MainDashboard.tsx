import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Mic, Settings, LogOut, ArrowRight, LayoutGrid } from "lucide-react-native";
import { RootStackParamList } from "../navigation/AppNavigator";
import { colors } from "../theme";
import { useSpeechInput } from "../ai/speech/useSpeechInput";
import { whisperTranscribe } from "../ai/speech/whisperTranscriber";
import { runAI } from "../ai/core/runAI";
import { mainDashboardTriage } from "../ai/scopes/main/dashboardTriage";
import { useUserProfile } from "../profile/hooks/useUserProfile";

type Nav = NativeStackNavigationProp<RootStackParamList, "Main">;

type TriageResult = {
  transcript: string;
  reply: string;
  route: keyof RootStackParamList;
  routeLabel: string;
};

const RECORD_LIMIT = 5;
const BTN_SIZE = 160;

export function MainDashboard() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const fs = (size: number) => Math.round(size * Math.max(Math.min(width / 390, 1), 0.78));
  const { profile } = useUserProfile();
  const firstName = profile.name.trim().split(" ")[0] || "there";

  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<TriageResult | null>(null);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(RECORD_LIMIT);

  const timerAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const timerAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const pulseAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const { isRecording, speechError, clearSpeechError, startRecording, stopRecording } =
    useSpeechInput({
      transcribe: whisperTranscribe,
      onTranscript: handleTranscript,
    });

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

      pulseAnim.setValue(0);
      pulseAnimRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
        ])
      );
      pulseAnimRef.current.start();

      intervalRef.current = setInterval(() => {
        setCountdown((s) => s - 1);
      }, 1000);

      autoStopRef.current = setTimeout(() => {
        stopRecording();
      }, RECORD_LIMIT * 1000);
    } else {
      timerAnimRef.current?.stop();
      pulseAnimRef.current?.stop();
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (autoStopRef.current) clearTimeout(autoStopRef.current);
      timerAnim.setValue(0);
      pulseAnim.setValue(0);
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

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(""), 5000);
    return () => clearTimeout(t);
  }, [error]);

  useEffect(() => {
    if (!speechError) return;
    const t = setTimeout(() => clearSpeechError(), 5000);
    return () => clearTimeout(t);
  }, [speechError]);

  const displayError = error || speechError;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 12 }]}>

      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.replace("Splash")}
          style={styles.topBtn}
          accessibilityLabel="Logout"
        >
          <LogOut size={24} color="#F44336" />
          <Text style={[styles.topBtnText, { color: "#F44336", fontSize: fs(18) }]}>Logout</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate("Settings")}
          style={styles.topBtn}
          accessibilityLabel="Settings"
        >
          <Settings size={24} color={colors.textMuted} />
          <Text style={[styles.topBtnText, { color: colors.textMuted, fontSize: fs(18) }]}>Settings</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.greetingZone}>
        <Text style={[styles.greeting, { fontSize: fs(36) }]}>Hello, {firstName}</Text>
        <View style={styles.subRow}>
          {displayError ? (
            <Text style={[styles.errorText, { fontSize: fs(22) }]}>I'm sorry, I didn't quite catch that. Please give it another try!</Text>
          ) : (
            <Text style={[styles.sub, { fontSize: fs(22) }]}>
              {isRecording
                ? "Recording..."
                : isProcessing
                ? "Processing your request…"
                : "I'd love to hear from you, tap to tell me what's on your mind"}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.buttonZone}>
        <View style={styles.btnWrapper}>
          {isRecording && (
            <Animated.View
              style={[styles.timerRing, { opacity: pulseAnim }]}
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
            <Text style={[styles.recordLabel, { fontSize: fs(22) }]}>
              {isProcessing ? "Thinking..." : isRecording ? `Recording... ${countdown}s` : "Press here to start recording"}
            </Text>
            {isProcessing ? (
              <ActivityIndicator size="large" color={colors.text} />
            ) : (
              <Mic size={36} color={isRecording ? colors.text : "#E53935"} strokeWidth={2.5} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.contentBox}>
        {result ? (
          <>
            <Text style={styles.transcriptLabel}>You said:</Text>
            <Text style={styles.transcriptText}>"{result.transcript}"</Text>
            <Text style={[styles.replyText, { fontSize: fs(18) }]}>{result.reply}</Text>
            <TouchableOpacity
              style={styles.navBtn}
              onPress={() => navigation.navigate(result.route as any)}
              accessibilityLabel={`Go to ${result.routeLabel}`}
            >
              <Text style={[styles.navBtnText, { fontSize: fs(18) }]}>Go to {result.routeLabel}</Text>
              <ArrowRight size={20} color={colors.background} strokeWidth={2.5} />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={[styles.suggestionsLabel, { fontSize: fs(13) }]}>You could ask me things like...</Text>
            <View style={styles.suggestionsBody}>
              {[
                "What's my next pill?",
                "I'm not feeling well",
                "Explain my prescription",
                "Help me understand my diagnosis",
                "When should I take my medication?",
              ].map((q) => (
                <View key={q} style={styles.suggestionRow}>
                  <View style={styles.suggestionDot} />
                  <Text style={[styles.suggestionText, { fontSize: fs(16) }]}>{q}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </View>

      <TouchableOpacity
        onPress={() => navigation.navigate("Home")}
        style={[styles.exploreBtn, (isRecording || isProcessing) && styles.exploreBtnDisabled]}
        disabled={isRecording || isProcessing}
        accessibilityLabel="Explore features"
      >
        <LayoutGrid size={20} color={(isRecording || isProcessing) ? colors.textCaption : colors.primary} strokeWidth={2} />
        <Text style={[styles.exploreBtnText, (isRecording || isProcessing) && styles.exploreBtnTextDisabled, { fontSize: fs(20) }]}>
          Explore Features
        </Text>
        <ArrowRight size={18} color={(isRecording || isProcessing) ? colors.textCaption : colors.primary} strokeWidth={2.5} />
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
  },

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
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },

  errorText: {
    color: "#E53935",
    fontSize: 22,
    textAlign: "center",
  },

  buttonZone: {
    alignItems: "center",
    paddingTop: 12,
  },
  recordBtn: {
    width: "100%",
    height: BTN_SIZE,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 3,
    borderStyle: "dashed",
    borderColor: "#E53935",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: "#E53935",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  recordBtnActive: {
    backgroundColor: "#E53935",
    borderStyle: "solid",
    borderColor: "#E53935",
    shadowColor: "#E53935",
    shadowOpacity: 0.6,
    shadowRadius: 24,
  },
  recordBtnDisabled: {
    backgroundColor: colors.card,
    borderColor: "#E53935",
    shadowOpacity: 0.4,
  },
  recordLabel: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "700",
  },

  btnWrapper: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  timerRing: {
    position: "absolute",
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "rgba(13,217,247,0.8)",
  },

  exploreBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.card,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  exploreBtnText: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  exploreBtnDisabled: {
    backgroundColor: colors.card,
    shadowOpacity: 0,
    elevation: 0,
  },
  exploreBtnTextDisabled: {
    color: colors.textCaption,
  },

  contentBox: {
    flex: 1,
    marginTop: 14,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
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

  suggestionsLabel: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  suggestionsBody: {
    flex: 1,
    justifyContent: "space-evenly",
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  suggestionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    opacity: 0.7,
  },
  suggestionText: {
    color: colors.textMuted,
    fontSize: 20,
    fontStyle: "italic",
  },
});
