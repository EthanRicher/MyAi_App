import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Mic } from "lucide-react-native";
import { BackButton } from "../components/BackButton";
import { BackendRequiredModal } from "../components/BackendRequiredModal";
import { colors } from "../theme";

export function ClarityRecord() {
  const [showBackend, setShowBackend] = useState(true);

  return (
    <View style={styles.container}>
      <BackButton label="Clarity" to="Clarity" />
      <View style={styles.body}>
        <View style={styles.micCircle}>
          <Mic size={48} color={colors.primary} />
        </View>
        <Text style={styles.heading}>Tap to Record</Text>
        <Text style={styles.desc}>Record a doctor conversation and we'll simplify it for you.</Text>
        <TouchableOpacity
          onPress={() => setShowBackend(true)}
          style={styles.btn}
          accessibilityLabel="Start recording"
        >
          <Text style={styles.btnText}>Start Recording</Text>
        </TouchableOpacity>
        <Text style={styles.note}>Stored only on your device.</Text>
      </View>
      <BackendRequiredModal
        open={showBackend}
        onClose={() => setShowBackend(false)}
        description="Recording requires microphone access, Whisper speech-to-text, and GPT processing to translate medical conversations into plain language."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 24,
  },
  micCircle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 4,
    borderColor: colors.primary,
    backgroundColor: "rgba(13,217,247,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  heading: { color: colors.text, fontSize: 28, fontWeight: "700", textAlign: "center" },
  desc: { color: colors.textMuted, fontSize: 18, textAlign: "center", lineHeight: 27 },
  btn: {
    width: "100%",
    maxWidth: 280,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
  },
  btnText: { color: colors.background, fontSize: 20, fontWeight: "700" },
  note: { color: colors.textCaption, fontSize: 15 },
});
