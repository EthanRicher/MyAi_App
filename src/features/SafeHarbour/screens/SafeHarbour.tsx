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
  Modal,
  Keyboard as RNKeyboard,
} from "react-native";
import { Mic, Keyboard, Camera, Phone, Shield, AlertTriangle, CheckCircle2, Sparkles, X, Search, HelpCircle, Info } from "lucide-react-native";
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
  unsure: { label: "Unsure", color: colors.textMuted, icon: HelpCircle },
};

export function SafeHarbour() {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState("");
  const [showText, setShowText] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ScamCheckOutput | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [showInputModal, setShowInputModal] = useState(false);

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
  }, [speechError]);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(""), 4000);
    return () => clearTimeout(t);
  }, [error]);

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
      setShowInputModal(false);
      setShowText(false);
      setDraft("");
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
      setShowInputModal(false);
      setShowText(false);
      setDraft("");
    } finally {
      setProcessing(false);
    }
  };

  const closeInputModal = () => {
    if (isRecording) return;
    setShowInputModal(false);
    setShowText(false);
    setDraft("");
    setError("");
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
        <TouchableOpacity
          onPress={() => setShowInputModal(true)}
          style={styles.checkBtn}
          activeOpacity={0.8}
          accessibilityLabel="Check for scam"
        >
          <Search size={24} color={colors.background} />
          <Text style={styles.checkBtnText}>Check for Scam</Text>
        </TouchableOpacity>
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

              <View style={styles.resultFooter}>
                <View style={styles.disclaimerRow}>
                  <Info size={16} color={colors.orange} />
                  <Text style={styles.disclaimerText}>
                    AI can be wrong — double-check before acting.
                  </Text>
                </View>
                <TouchableOpacity onPress={clearResult} style={styles.clearBtn} accessibilityLabel="Clear result">
                  <Text style={styles.clearBtnText}>Clear</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.placeholder}>
              <AlertTriangle size={48} color={colors.textCaption} />
              <Text style={styles.placeholderTitle}>Scam Report will appear here</Text>
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

      <Modal
        visible={showInputModal}
        transparent
        animationType="fade"
        onRequestClose={closeInputModal}
      >
        <View style={styles.overlay}>
          <View style={styles.inputModalCard}>
            <Text
              style={[styles.modalHeading, error && styles.modalHeadingError]}
              numberOfLines={2}
            >
              {error || "How would you like to check?"}
            </Text>

            <TouchableOpacity
              onPress={handleMicPress}
              disabled={processing}
              style={[
                styles.recordBtn,
                isRecording && styles.recordBtnActive,
                processing && styles.btnDisabled,
              ]}
              accessibilityLabel={isRecording ? "Stop recording" : "Start recording"}
            >
              {processing && !isRecording ? (
                <ActivityIndicator color={colors.text} />
              ) : (
                <Mic size={32} color={isRecording ? colors.text : colors.background} />
              )}
              <Text style={[styles.recordBtnText, isRecording && { color: colors.text }]}>
                {processing && !isRecording ? "Checking..." : isRecording ? "Tap to stop" : "Tap to record"}
              </Text>
            </TouchableOpacity>

            {!showText ? (
              <TouchableOpacity
                onPress={() => setShowText(true)}
                style={styles.typeBtn}
                disabled={processing || isRecording}
              >
                <Keyboard size={18} color={colors.destructive} />
                <Text style={styles.typeBtnText}>Type</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.typeWrap}>
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  placeholder="Paste or type the message..."
                  placeholderTextColor={colors.textCaption}
                  style={styles.input}
                  multiline
                  autoFocus
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

            <TouchableOpacity
              onPress={handlePhoto}
              style={styles.photoBtn}
              disabled={processing || isRecording}
            >
              <Camera size={18} color={colors.destructive} />
              <Text style={styles.photoBtnText}>Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={closeInputModal}
              style={styles.inputCloseBtn}
              disabled={isRecording}
              accessibilityLabel="Close"
            >
              <Text style={[styles.inputCloseBtnText, isRecording && { opacity: 0.4 }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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

  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.primary + "44",
  },
  cardHeading: { color: colors.text, fontSize: 19, fontWeight: "700" },

  checkBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    borderRadius: 14,
    backgroundColor: colors.destructive,
  },
  checkBtnText: { color: colors.background, fontSize: 19, fontWeight: "800" },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  inputModalCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  modalHeading: { color: colors.text, fontSize: 20, fontWeight: "700", textAlign: "center" },
  modalHeadingError: { color: colors.destructive },

  typeBtn: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.destructive,
    backgroundColor: "transparent",
  },
  typeBtnText: { color: colors.destructive, fontSize: 15, fontWeight: "700" },
  photoBtn: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.destructive,
    backgroundColor: "transparent",
  },
  photoBtnText: { color: colors.destructive, fontSize: 15, fontWeight: "700" },
  inputCloseBtn: {
    alignSelf: "stretch",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    marginTop: 4,
  },
  inputCloseBtnText: { color: colors.textMuted, fontSize: 16, fontWeight: "600" },

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
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  placeholderTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
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
  verdict: { fontSize: 22, fontWeight: "700" },
  thumb: { width: "100%", height: 160, borderRadius: 10 },
  flagsWrap: { gap: 8 },
  flagsHeading: { color: colors.textMuted, fontSize: 14, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4 },
  flagRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  flagBullet: { width: 9, height: 9, borderRadius: 4.5, marginTop: 8 },
  flagText: { flex: 1, color: colors.text, fontSize: 17, lineHeight: 24 },
  explanation: { color: colors.textMuted, fontSize: 17, lineHeight: 24 },
  resultFooter: { marginTop: "auto", gap: 8 },
  disclaimerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.orange,
    backgroundColor: "rgba(255,152,0,0.15)",
  },
  disclaimerText: {
    flex: 1,
    color: colors.orange,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  clearBtn: {
    alignSelf: "stretch",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.destructive,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  clearBtnText: { color: colors.destructive, fontSize: 16, fontWeight: "700" },

  contactList: { gap: 8 },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  contactText: { color: colors.textMuted, fontSize: 16 },
  contactBold: { color: colors.text, fontWeight: "700" },
});
