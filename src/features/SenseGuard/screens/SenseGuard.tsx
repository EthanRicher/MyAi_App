import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  ActivityIndicator,
  Keyboard as RNKeyboard,
} from "react-native";
import { Phone, Trash2, Mic, Keyboard, Sparkles } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackButton } from "../../../components/BackButton";
import { colors } from "../../../theme";
import { useSpeechInput } from "../../../backend/1_Input/Speech/Input_SpeechHook";
import { whisperTranscribe } from "../../../backend/1_Input/Speech/Input_Whisper";
import { runAI } from "../../../backend/_AI/AI_Run";
import { senseguardSymptomLog, SymptomLogOutput } from "../../../backend/3_Scopes/SenseGuard/Log_Symptom";

interface Entry {
  id: string;
  title: string;
  summary: string;
  severity: number;
  rawText: string;
  timestamp: string;
}

const STORAGE_KEY = "SENSEGUARD_ENTRIES";
const SEVERITY_COLOURS = ["#4CAF50", "#8BC34A", "#CDDC39", "#FFC107", "#FF9800", "#E53935"];

const formatWhen = (iso: string) => {
  try {
    const d = new Date(iso);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  } catch {
    return "";
  }
};

export function SenseGuard() {
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [draft, setDraft] = useState("");
  const [showText, setShowText] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const [pending, setPending] = useState<{
    raw: string;
    title: string;
    summary: string;
    severity: number;
  } | null>(null);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setEntries(JSON.parse(raw));
      } catch {}
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries, loaded]);

  const handleTranscript = (text: string) => {
    if (!text.trim()) return;
    runProcess(text.trim());
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

  const runProcess = async (text: string) => {
    setError("");
    setProcessing(true);
    try {
      const result = await runAI({ text, scope: senseguardSymptomLog });
      if (result.error) {
        setError("Couldn't process that. Please try again.");
        return;
      }
      const output = result.output as SymptomLogOutput;
      if (!output?.title && !output?.summary) {
        setError("I couldn't make sense of that. Please try again.");
        return;
      }
      setPending({
        raw: text,
        title: output.title || "Untitled symptom",
        summary: output.summary || `- ${text}`,
        severity: output.severity || 3,
      });
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
    runProcess(text);
  };

  const confirmLog = () => {
    if (!pending) return;
    const entry: Entry = {
      id: Date.now().toString(),
      title: pending.title.trim() || "Untitled symptom",
      summary: pending.summary,
      severity: pending.severity,
      rawText: pending.raw,
      timestamp: new Date().toISOString(),
    };
    setEntries((prev) => [entry, ...prev]);
    setPending(null);
  };

  const cancelPending = () => setPending(null);

  const deleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const toggleExpanded = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 12 }]}>
      <BackButton label="SenseGuard" to="Home" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.emergency}>
          <Phone size={20} color={colors.text} />
          <Text style={styles.emergencyText}>Emergency? Call 000 immediately</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardHeading}>Log a Symptom</Text>
          <Text style={styles.cardSub}>
            Tap and describe how you're feeling — I'll write it up for you.
          </Text>

          <TouchableOpacity
            onPress={handleMicPress}
            disabled={processing}
            style={[
              styles.recordBtn,
              isRecording && styles.recordBtnActive,
              processing && styles.recordBtnDisabled,
            ]}
            accessibilityLabel={isRecording ? "Stop recording" : "Start recording"}
          >
            {processing ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Mic size={32} color={isRecording ? colors.text : colors.background} />
            )}
            <Text style={[styles.recordBtnText, isRecording && { color: colors.text }]}>
              {processing ? "Writing it up..." : isRecording ? "Tap to stop" : "Tap to record"}
            </Text>
          </TouchableOpacity>

          {!showText ? (
            <TouchableOpacity
              onPress={() => setShowText(true)}
              style={styles.typeToggle}
              disabled={processing}
            >
              <Keyboard size={16} color={colors.textMuted} />
              <Text style={styles.typeToggleText}>or type instead</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.typeWrap}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Describe how you're feeling..."
                placeholderTextColor={colors.textCaption}
                style={styles.input}
                multiline
                accessibilityLabel="Type your symptom"
              />
              <TouchableOpacity
                onPress={handleProcessTyped}
                disabled={processing || !draft.trim()}
                style={[styles.processBtn, (!draft.trim() || processing) && styles.processBtnDisabled]}
              >
                <Sparkles size={18} color={colors.background} />
                <Text style={styles.processBtnText}>
                  {processing ? "Processing..." : "Write it up"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>

        <View style={styles.entriesWrap}>
          <Text style={styles.sectionHeading}>Recent Entries</Text>
          {entries.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No symptoms logged yet</Text>
            </View>
          ) : (
            <View style={styles.entryList}>
              {entries.map((e) => {
                const isOpen = !!expanded[e.id];
                return (
                  <View key={e.id} style={styles.entryRow}>
                    <TouchableOpacity
                      onPress={() => toggleExpanded(e.id)}
                      style={styles.entryTop}
                      activeOpacity={0.7}
                    >
                      <View style={styles.entryMeta}>
                        <Text style={styles.entryTitle}>{e.title}</Text>
                        <Text style={styles.entryDate}>{formatWhen(e.timestamp)}</Text>
                      </View>
                      <View style={styles.entryDots}>
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                          <View
                            key={n}
                            style={[
                              styles.entryDot,
                              { backgroundColor: n <= e.severity ? SEVERITY_COLOURS[e.severity - 1] : colors.border },
                            ]}
                          />
                        ))}
                      </View>
                      <TouchableOpacity
                        onPress={() => deleteEntry(e.id)}
                        style={styles.entryDelete}
                        accessibilityLabel={`Delete ${e.title}`}
                      >
                        <Trash2 size={18} color={colors.destructive} />
                      </TouchableOpacity>
                    </TouchableOpacity>
                    {isOpen && !!e.summary && (
                      <Text style={styles.entrySummary}>{e.summary}</Text>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <Text style={styles.disclaimer}>This is not medical advice. Always confirm with your doctor.</Text>
      </ScrollView>

      <Modal
        visible={pending !== null}
        transparent
        animationType="fade"
        onRequestClose={cancelPending}
      >
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalHeading}>Does this look right?</Text>

            <Text style={styles.modalLabel}>Title</Text>
            <TextInput
              value={pending?.title || ""}
              onChangeText={(t) => pending && setPending({ ...pending, title: t })}
              style={styles.modalTitleInput}
              placeholder="Title"
              placeholderTextColor={colors.textCaption}
            />

            <Text style={styles.modalLabel}>Summary</Text>
            <Text style={styles.modalSummary}>{pending?.summary}</Text>

            <Text style={styles.modalLabel}>Severity</Text>
            <View style={styles.modalSevRow}>
              {[1, 2, 3, 4, 5, 6].map((n) => {
                const c = SEVERITY_COLOURS[n - 1];
                const active = !!pending && n <= pending.severity;
                return (
                  <TouchableOpacity
                    key={n}
                    onPress={() => pending && setPending({ ...pending, severity: n })}
                    style={[
                      styles.modalSevBtn,
                      {
                        backgroundColor: active ? c : "transparent",
                        borderColor: active ? c : colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.modalSevNum, { color: active ? colors.background : colors.textCaption }]}>{n}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={cancelPending} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmLog} style={styles.logBtnConfirm}>
                <Text style={styles.logBtnConfirmText}>Log it</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, gap: 14 },

  emergency: {
    backgroundColor: colors.destructive,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  emergencyText: { color: colors.text, fontSize: 16, fontWeight: "600" },

  card: { backgroundColor: colors.card, borderRadius: 12, padding: 14, gap: 10 },
  cardHeading: { color: colors.text, fontSize: 19, fontWeight: "700" },
  cardSub: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },

  recordBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: colors.orange,
    borderRadius: 14,
    paddingVertical: 16,
  },
  recordBtnActive: {
    backgroundColor: colors.destructive,
  },
  recordBtnDisabled: {
    opacity: 0.6,
  },
  recordBtnText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: "700",
  },

  typeToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 6,
  },
  typeToggleText: { color: colors.textMuted, fontSize: 14 },
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
    minHeight: 80,
    textAlignVertical: "top",
  },
  processBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.orange,
  },
  processBtnDisabled: { opacity: 0.5 },
  processBtnText: { color: colors.background, fontSize: 16, fontWeight: "700" },

  error: { color: colors.destructive, fontSize: 14, textAlign: "center" },

  entriesWrap: { gap: 8 },
  sectionHeading: { color: colors.text, fontSize: 19, fontWeight: "700" },
  emptyBox: {
    borderRadius: 10,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.border,
    paddingVertical: 28,
    alignItems: "center",
  },
  emptyText: { color: colors.textMuted, fontSize: 15 },
  entryList: { gap: 8 },
  entryRow: {
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  entryTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  entryMeta: { flex: 1 },
  entryTitle: { color: colors.text, fontSize: 17, fontWeight: "600" },
  entryDate: { color: colors.textCaption, fontSize: 13, marginTop: 2 },
  entryDots: { flexDirection: "row", gap: 4 },
  entryDot: { width: 8, height: 8, borderRadius: 4 },
  entryDelete: { paddingHorizontal: 6, paddingVertical: 4 },
  entrySummary: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  disclaimer: { color: colors.textCaption, textAlign: "center", fontSize: 13, lineHeight: 20, marginTop: 4 },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    gap: 8,
  },
  modalHeading: { color: colors.text, fontSize: 20, fontWeight: "700", marginBottom: 6 },
  modalLabel: { color: colors.textCaption, fontSize: 13, fontWeight: "600", textTransform: "uppercase", marginTop: 8 },
  modalTitleInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 17,
    fontWeight: "600",
  },
  modalSummary: { color: colors.text, fontSize: 15, lineHeight: 22 },
  modalSevRow: { flexDirection: "row", gap: 6, marginTop: 4 },
  modalSevBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  modalSevNum: { fontSize: 15, fontWeight: "700" },
  modalBtns: { flexDirection: "row", gap: 10, marginTop: 16 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: "center" },
  cancelText: { color: colors.textMuted, fontSize: 16, fontWeight: "600" },
  logBtnConfirm: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.orange, alignItems: "center" },
  logBtnConfirmText: { color: colors.background, fontSize: 16, fontWeight: "700" },
});
