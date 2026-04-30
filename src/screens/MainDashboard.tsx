import { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
  useWindowDimensions,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Mic, Settings, LogOut, LayoutGrid, ArrowRight } from "lucide-react-native";
import { RootStackParamList } from "../navigation/AppNavigator";
import { colors } from "../theme";
import { useUserProfile } from "../profile/hooks/useUserProfile";
import { useSpeechInput } from "../backend/1_Input/Speech/Input_SpeechHook";
import { whisperTranscribe } from "../backend/1_Input/Speech/Input_Whisper";

type Nav = NativeStackNavigationProp<RootStackParamList, "Main">;

const BTN_SIZE = 170;

export function MainDashboard() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
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
    ? "Processing your request..."
    : isRecording
    ? "Listening... tap to stop"
    : "Tap the button to speak with your doctor assistant";

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
        <Text style={[error ? styles.errorText : styles.sub, { fontSize: fs(20) }]}>
          {statusText}
        </Text>
      </View>

      {(() => {
        const logoSize = width * 1.3;
        const downOffset = 30;
        return (
          <Image
            source={require("../assets/Logo_Empty.png")}
            style={[
              styles.logoBackdrop,
              {
                width: logoSize,
                height: logoSize,
                top: height / 2 - logoSize / 2 + downOffset,
              },
            ]}
            resizeMode="contain"
          />
        );
      })()}

      <View style={[styles.centerZone, { top: height / 2 - BTN_SIZE / 2 }]} pointerEvents="box-none">
        <Animated.View style={{ transform: [{ scale: pulseAnim }, { translateY: -10 }] }}>
          <TouchableOpacity
            onPress={handlePress}
            disabled={isProcessing}
            style={[
              styles.recordCircle,
              isRecording && styles.recordCircleActive,
              isProcessing && styles.recordCircleProcessing,
            ]}
            activeOpacity={0.8}
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

      <TouchableOpacity
        onPress={() => navigation.navigate("Home")}
        disabled={isRecording || isProcessing}
        style={[styles.exploreBtn, (isRecording || isProcessing) && styles.exploreBtnDisabled]}
        accessibilityLabel="Explore features"
      >
        <LayoutGrid size={20} color={(isRecording || isProcessing) ? colors.textCaption : colors.primary} strokeWidth={2} />
        <Text style={[styles.exploreBtnText, (isRecording || isProcessing) && styles.exploreBtnTextDisabled, { fontSize: fs(28) }]}>
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
    fontWeight: "600",
  },

  greetingZone: {
    alignItems: "center",
    paddingTop: 0,
    gap: 8,
    paddingHorizontal: 16,
  },
  logoBackdrop: {
    position: "absolute",
    alignSelf: "center",
  },
  centerZone: {
    position: "absolute",
    left: -24,
    right: -24,
    alignItems: "center",
    gap: 24,
  },
  greeting: {
    color: colors.text,
    fontWeight: "700",
    textAlign: "center",
  },
  sub: {
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 28,
  },
  errorText: {
    color: "#E53935",
    textAlign: "center",
    lineHeight: 28,
    fontWeight: "600",
  },

  recordCircle: {
    width: BTN_SIZE,
    height: BTN_SIZE,
    borderRadius: BTN_SIZE / 2,
    backgroundColor: "#E53935",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#E53935",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
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
    position: "absolute",
    bottom: 60,
    left: 0,
    right: 0,
    paddingVertical: 28,
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
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  exploreBtnDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  exploreBtnTextDisabled: {
    color: colors.textCaption,
  },
});
