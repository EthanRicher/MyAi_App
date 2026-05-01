import { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Mic, Settings, LogOut, LayoutGrid, ArrowRight, Stethoscope } from "lucide-react-native";
import { RootStackParamList } from "../navigation/AppNavigator";
import { colors } from "../theme";
import { useUserProfile } from "../profile/hooks/useUserProfile";
import { useSpeechInput } from "../backend/1_Input/Speech/Input_SpeechHook";
import { whisperTranscribe } from "../backend/1_Input/Speech/Input_Whisper";

type Nav = NativeStackNavigationProp<RootStackParamList, "Main">;

const BTN_SIZE = 170;
// Same accent as the Sign In button on the login screen, so the brand
// tone carries through from the login flow into the dashboard.
const ACCENT = colors.primary;

export function MainDashboard() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const fs = (size: number) => Math.round(size * Math.max(Math.min(width / 390, 1), 0.78));
  const { profile } = useUserProfile();
  const firstName = profile.name.trim().split(" ")[0] || "there";

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseRef = useRef<Animated.CompositeAnimation | null>(null);

  const startPulse = () => {
    pulseRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    pulseRef.current.start();
  };

  const stopPulse = () => {
    pulseRef.current?.stop();
    pulseAnim.setValue(1);
  };

  const handleTranscript = (transcript: string) => {
    setIsProcessing(true);
    stopPulse();
    setError("");
    navigation.navigate("ClarityChat", {
      scopeId: "clarityDoctorExplained",
      initialMessage: transcript,
    });
    setIsProcessing(false);
  };

  const { isRecording, speechError, clearSpeechError, startRecording, stopRecording } = useSpeechInput({
    transcribe: whisperTranscribe,
    onTranscript: handleTranscript,
  });

  useEffect(() => {
    if (!speechError) return;
    stopPulse();
    setError("I'm sorry, I didn't quite catch that. Please give it another try!");
    clearSpeechError();
    const t = setTimeout(() => setError(""), 5000);
    return () => clearTimeout(t);
  }, [speechError]);

  const handlePress = () => {
    if (isRecording) {
      stopRecording();
      stopPulse();
    } else {
      setError("");
      startRecording();
      startPulse();
    }
  };

  const statusText = error
    ? error
    : isProcessing
    ? "Working on it..."
    : isRecording
    ? "Listening — tap to stop"
    : "Tap the mic to record what your doctor said";

  const buttonsDisabled = isRecording || isProcessing;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 4, paddingBottom: insets.bottom + 12 }]}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.replace("Splash")}
          style={styles.topBtn}
          accessibilityLabel="Logout"
        >
          <LogOut size={22} color={colors.destructive} />
          <Text style={[styles.topBtnText, { color: colors.destructive, fontSize: fs(17) }]}>Logout</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate("Settings")}
          style={styles.topBtn}
          accessibilityLabel="Settings"
        >
          <Settings size={22} color={colors.textMuted} />
          <Text style={[styles.topBtnText, { color: colors.textMuted, fontSize: fs(17) }]}>Settings</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.greetingZone}>
        <Text style={[styles.greeting, { fontSize: fs(34) }]}>Hello, {firstName}!</Text>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={styles.heroIcon}>
            <Stethoscope size={22} color={ACCENT} />
          </View>
          <View style={styles.heroHeaderText}>
            <Text style={[styles.heroTitle, { fontSize: fs(20) }]}>Doctor Explained</Text>
            <Text style={[styles.heroSubtitle, { fontSize: fs(14) }]}>
              Record your doctor — get a plain-English version
            </Text>
          </View>
        </View>

        <View style={styles.heroCenter}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              onPress={handlePress}
              disabled={isProcessing}
              style={[
                styles.recordCircle,
                isRecording && styles.recordCircleActive,
                isProcessing && styles.recordCircleProcessing,
              ]}
              activeOpacity={0.85}
              accessibilityLabel={isRecording ? "Stop recording" : "Start recording"}
            >
              {isProcessing ? (
                <ActivityIndicator size="large" color="#fff" />
              ) : (
                <Mic size={64} color="#fff" strokeWidth={2} />
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>

        <View style={styles.heroStatus}>
          <Text
            style={[
              error ? styles.statusError : styles.statusText,
              { fontSize: fs(16) },
            ]}
          >
            {statusText}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => navigation.navigate("Home")}
        disabled={buttonsDisabled}
        style={[styles.exploreBtn, buttonsDisabled && styles.exploreBtnDisabled]}
        accessibilityLabel="Explore features"
      >
        <LayoutGrid size={22} color={buttonsDisabled ? colors.textCaption : ACCENT} strokeWidth={2} />
        <Text style={[styles.exploreBtnText, buttonsDisabled && styles.exploreBtnTextDisabled, { fontSize: fs(20) }]}>
          Explore Features
        </Text>
        <ArrowRight size={20} color={buttonsDisabled ? colors.textCaption : ACCENT} strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
  },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  topBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: ACCENT + "44",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  topBtnText: {
    fontWeight: "600",
  },

  greetingZone: {
    alignItems: "center",
    paddingTop: 18,
    paddingBottom: 16,
    gap: 6,
  },
  greeting: {
    color: colors.text,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 0.2,
  },

  // Hero card holds the entire recording experience: title, mic, status.
  // flex:1 makes it absorb the remaining vertical space so the page never
  // has unused dead area.
  heroCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: ACCENT + "44",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 22,
    gap: 12,
    overflow: "hidden",
  },
  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: ACCENT + "1F",
    alignItems: "center",
    justifyContent: "center",
  },
  heroHeaderText: {
    flex: 1,
    gap: 2,
  },
  heroTitle: {
    color: colors.text,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  heroSubtitle: {
    color: colors.textMuted,
    lineHeight: 19,
  },
  heroCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  heroStatus: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  statusText: {
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
  },
  statusError: {
    color: colors.destructive,
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "700",
  },

  recordCircle: {
    width: BTN_SIZE,
    height: BTN_SIZE,
    borderRadius: BTN_SIZE / 2,
    backgroundColor: colors.destructive,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.destructive,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 24,
    elevation: 14,
  },
  recordCircleActive: {
    backgroundColor: "#b71c1c",
    shadowOpacity: 0.8,
    shadowRadius: 32,
  },
  recordCircleProcessing: {
    backgroundColor: "#555",
    shadowOpacity: 0.2,
  },

  exploreBtn: {
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: ACCENT + "44",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 12,
  },
  exploreBtnText: {
    color: ACCENT,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  exploreBtnDisabled: {
    borderColor: colors.border,
  },
  exploreBtnTextDisabled: {
    color: colors.textCaption,
  },
});
