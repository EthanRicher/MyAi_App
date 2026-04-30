import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  Keyboard as RNKeyboard,
} from "react-native";
import { Mic, Keyboard, Camera, Phone, Shield, AlertTriangle, CheckCircle2, Sparkles, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackButton } from "../../../components/BackButton";
import { colors } from "../../../theme";
import { useSpeechInput } from "../../../backend/1_Input/Speech/Input_SpeechHook";
import { whisperTranscribe } from "../../../backend/1_Input/Speech/Input_Whisper";
import { openCameraAndScan, PhotoMode } from "../../../backend/1_Input/Camera/Input_Camera";
import { runAI } from "../../../backend/_AI/AI_Run";
import { runAIOnPhoto } from "../../../backend/1_Input/Camera/Input_PhotoToAI";
import { safeHarbourScamCheck, ScamCheckOutput, ScamLevel } from "../../../backend/3_Scopes/SafeHarbour/Check_Scam";

const LEVEL_META: Record<ScamLevel, { label: string; color: string; icon: any }> = {
  low: { label: "Low Risk", color: colors.green, icon: CheckCircle2 },
  med: { label: "Medium Risk", color: colors.orange, icon: AlertTriangle },
  high: { label: "High Risk", color: colors.destructive, icon: AlertTriangle },
};

export function SafeHarbour() {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState("");
  const [showText, setShowText] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ScamCheckOutput | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const handleTranscript = (text: string) => {
    if (!text.trim()) return;
    runTextCheck(text.trim());
  };

  const { isRecording, speechError, clearSpeechError, startRecording, stopRecording } = useSpeechInput({
    transcribe: whisperTranscribe,
    onTranscript: handleTranscript,
  });

  useEffect(() => {
    if (!speechError) return;
    setError("Couldn't hear that. Please try again.");
    clearSpeechError();
    const t = setTimeout(() => setError(""), 4000);
    return () => clearTimeout(t);
  }, [speechError]);

  const runTextCheck = async (text: string) => {
    setError("");
    setResult(null);
    setPhotoUri(null);
    setProcessing(true);
    try {
      const r = await runAI({ text, scope: safeHarbourScamCheck });
      if (r.error) {
        setError("Couldn't check that. Please try again.");
        return;
      }
      const output = r.output as ScamCheckOutput;
      if (!output?.level) {
        setError("I couldn't analyse that. Please try again.");
        return;
      }
      setResult(output);
    } finally {
      setProcessing(false);
    }
  };

  const handleMicPress = async () => {
    setError("");
    if (isRecording) {
      await stopRecording();
    } else {
      RNKeyboard.dismiss();
      setShowText(false);
      await startRecording();
    }
  };

  const handleProcessTyped = () => {
    const text = draft.trim();
    if (!text) return;
    RNKeyboard.dismiss();
    setDraft("");
    runTextCheck(text);
  };

  const handlePhoto = async () => {
    setError("");
    setResult(null);
    setProcessing(true);
    try {
      const cam = await openCameraAndScan(PhotoMode.VisionWithFallback, (uri) => setPhotoUri(uri));
      if (!cam) {
        setProcessing(false);
        return;
      }
      setPhotoUri(cam.imageUri);
      const r = await runAIOnPhoto(cam.imageUri, safeHarbourScamCheck, PhotoMode.VisionWithFallback);
      if (r.error) {
        setError("Couldn't check that photo. Please try again.");
        return;
      }
      const output = r.output as ScamCheckOutput;
      if (!output?.level) {
        setError("I couldn't analyse that photo. Please try again.");
        return;
      }
      setResult(output);
    } finally {
      setProcessing(false);
    }
  };

  const clearResult = () => {
    setResult(null);
    setPhotoUri(null);
    setError("");
  };

  const meta = result ? LEVEL_META[result.level] : null;
  const Icon = meta?.icon;

  return (
    <View style={styles.container}>
      <BackButton label="Safe Harbour" to="Home" />

      <View style={styles.inputZone}>
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Check Something for a Scam</Text>
          <Text style={styles.cardSub}>
            Read it out, type it, or take a photo of the message — I'll tell you whether it looks safe.
          </Text>

          <TouchableOpacity
            onPress={handleMicPress}
            disabled={processing}
            style={[
              styles.recordBtn,
              isRecording && styles.recordBtnActive,
              processing && styles.btnDisabled,
            ]}
            accessibilityLabel={isRecording ? "Stop recording" : "Record a message to check"}
          >
            {processing && !isRecording ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Mic size={28} color={isRecording ? colors.text : colors.background} />
            )}
            <Text style={[styles.recordBtnText, isRecording && { color: colors.text }]}>
              {processing && !isRecording ? "Checking..." : isRecording ? "Tap to stop" : "Tap to record"}
            </Text>
          </TouchableOpacity>

          <View style={styles.altRow}>
            <TouchableOpacity
              onPress={() => setShowText((s) => !s)}
              disabled={processing}
              style={[styles.altBtn, processing && styles.btnDisabled]}
            >
              <Keyboard size={18} color={colors.text} />
              <Text style={styles.altBtnText}>Type</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handlePhoto}
              disabled={processing}
              style={[styles.altBtn, processing && styles.btnDisabled]}
            >
              <Camera size={18} color={colors.text} />
              <Text style={styles.altBtnText}>Photo</Text>
            </TouchableOpacity>
          </View>

          {showText && (
            <View style={styles.typeWrap}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Paste or type the message..."
                placeholderTextColor={colors.textCaption}
                style={styles.input}
                multiline
                accessibilityLabel="Type a message to check"
              />
              <TouchableOpacity
                onPress={handleProcessTyped}
                disabled={processing || !draft.trim()}
                style={[styles.processBtn, (!draft.trim() || processing) && styles.btnDisabled]}
              >
                <Sparkles size={18} color={colors.background} />
                <Text style={styles.processBtnText}>
                  {processing ? "Checking..." : "Check this"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      </View>

      <ScrollView
        style={styles.breakdownScroll}
        contentContainerStyle={styles.breakdownScrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.breakdownArea,
            result && meta && { borderColor: meta.color, borderStyle: "solid" },
          ]}
        >
          {result && meta && Icon ? (
            <>
              <View style={styles.resultHeader}>
                <View style={[styles.levelPill, { backgroundColor: meta.color }]}>
                  <Icon size={18} color={colors.background} />
                  <Text style={styles.levelPillText}>{meta.label}</Text>
                </View>
                <TouchableOpacity onPress={clearResult} style={styles.closeBtn} accessibilityLabel="Dismiss result">
                  <X size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.verdict, { color: meta.color }]}>{result.verdict}</Text>

              {photoUri && (
                <Image source={{ uri: photoUri }} style={styles.thumb} resizeMode="cover" />
              )}

              {result.redFlags.length > 0 && (
                <View style={styles.flagsWrap}>
                  <Text style={styles.flagsHeading}>
                    {result.level === "low" ? "What looks normal:" : "What stood out:"}
                  </Text>
                  {result.redFlags.map((f, i) => (
                    <View key={i} style={styles.flagRow}>
                      <View style={[styles.flagBullet, { backgroundColor: meta.color }]} />
                      <Text style={styles.flagText}>{f}</Text>
                    </View>
                  ))}
                </View>
              )}

              {!!result.explanation && (
                <Text style={styles.explanation}>{result.explanation}</Text>
              )}
            </>
          ) : (
            <View style={styles.placeholder}>
              <AlertTriangle size={28} color={colors.textCaption} />
              <Text style={styles.placeholderTitle}>Scam breakdown will appear here</Text>
              <Text style={styles.placeholderHint}>
                Record, type, or take a photo above and the analysis will show in this box.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Emergency Contacts</Text>
          <View style={styles.contactList}>
            <View style={styles.contactRow}>
              <Phone size={20} color={colors.destructive} />
              <Text style={styles.contactText}>
                Scamwatch: <Text style={styles.contactBold}>1300 795 995</Text>
              </Text>
            </View>
            <View style={styles.contactRow}>
              <Shield size={20} color={colors.destructive} />
              <Text style={styles.contactText}>
                IDCARE: <Text style={styles.contactBold}>1800 595 160</Text>
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  inputZone: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  breakdownScroll: { flex: 1 },
  breakdownScrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingVertical: 12 },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },

  card: { backgroundColor: colors.card, borderRadius: 14, padding: 16, gap: 10 },
  cardHeading: { color: colors.text, fontSize: 19, fontWeight: "700" },
  cardSub: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },

  recordBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: colors.destructive,
    borderRadius: 14,
    paddingVertical: 16,
  },
  recordBtnActive: { backgroundColor: "#7a1d1d" },
  recordBtnText: { color: colors.background, fontSize: 18, fontWeight: "700" },

  altRow: { flexDirection: "row", gap: 10 },
  altBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  altBtnText: { color: colors.text, fontSize: 15, fontWeight: "600" },

  btnDisabled: { opacity: 0.5 },

  typeWrap: { gap: 8 },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 16,
    minHeight: 96,
    textAlignVertical: "top",
  },
  processBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.destructive,
  },
  processBtnText: { color: colors.background, fontSize: 16, fontWeight: "700" },

  error: { color: colors.destructive, fontSize: 14, textAlign: "center" },

  breakdownArea: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.border,
    padding: 16,
    gap: 12,
    minHeight: 140,
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  placeholderTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  placeholderHint: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  resultHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  levelPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  levelPillText: { color: colors.background, fontSize: 14, fontWeight: "800" },
  closeBtn: { paddingHorizontal: 6, paddingVertical: 4 },
  verdict: { fontSize: 19, fontWeight: "700" },
  thumb: { width: "100%", height: 160, borderRadius: 10 },
  flagsWrap: { gap: 6 },
  flagsHeading: { color: colors.textMuted, fontSize: 13, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4 },
  flagRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  flagBullet: { width: 8, height: 8, borderRadius: 4, marginTop: 7 },
  flagText: { flex: 1, color: colors.text, fontSize: 15, lineHeight: 22 },
  explanation: { color: colors.textMuted, fontSize: 15, lineHeight: 22 },

  contactList: { gap: 8 },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  contactText: { color: colors.textMuted, fontSize: 16 },
  contactBold: { color: colors.text, fontWeight: "700" },
});
