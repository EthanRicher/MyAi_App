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
  Image,
  Alert,
  Linking,
  Animated,
  Keyboard as RNKeyboard,
} from "react-native";
import { usePulseLoop } from "../../../hooks/usePulseLoop";
import { Phone, Mic, Keyboard, Sparkles, Plus, X, Pencil, Trash2 } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
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
  photoUris?: string[];
  timestamp: string;
}

interface Draft {
  id: string | null;
  raw: string;
  title: string;
  summary: string;
  severity: number;
  photoUris: string[];
  timestamp: string | null;
}

const STORAGE_KEY = "SENSEGUARD_ENTRIES";
const MOOD_STORAGE_KEY = "SENSEGUARD_MOOD";
const ACCENT = "#F472B6";
const ACCENT_DEEP = "#C2185B";
const SEVERITY_COLOURS = ["#4CAF50", "#8BC34A", "#CDDC39", "#FFC107", "#FF9800", "#E53935"];
const MOOD_COLOURS = ["#E53935", "#FF9800", "#FFC107", "#8BC34A", "#4CAF50"];
const MOOD_LABELS = ["Very low", "Low", "OK", "Good", "Great"];
const MOOD_EMOJI = ["😞", "🙁", "😐", "🙂", "😄"];

const formatTodayLabel = () => {
  try {
    return new Date().toLocaleDateString(undefined, {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  } catch {
    return "";
  }
};

const parseBullets = (summary: string): string[] => {
  if (!summary) return [];
  return summary
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-*•]\s*/, "").trim())
    .filter(Boolean);
};

const bulletsToSummary = (bullets: string[]): string =>
  bullets.map((b) => `- ${b}`).join("\n");

const normalizeBullet = (s: string): string =>
  s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

const overlapsExisting = (incoming: string, existing: string[]): boolean => {
  const a = normalizeBullet(incoming);
  if (!a) return true;
  return existing.some((b) => {
    const nb = normalizeBullet(b);
    return nb === a || (nb.length > 4 && a.includes(nb)) || (a.length > 4 && nb.includes(a));
  });
};

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
  const [showLogModal, setShowLogModal] = useState(false);
  const [mood, setMood] = useState<number | null>(null);
  const [showMoodModal, setShowMoodModal] = useState(false);

  const [pending, setPending] = useState<Draft | null>(null);


  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as any[];
          const migrated: Entry[] = parsed.map((e) => {
            const photoUris = Array.isArray(e.photoUris)
              ? e.photoUris
              : e.photoUri
                ? [e.photoUri]
                : undefined;
            const { photoUri: _legacy, ...rest } = e;
            return { ...rest, photoUris };
          });
          setEntries(migrated);
        }
      } catch {}
      try {
        const moodRaw = await AsyncStorage.getItem(MOOD_STORAGE_KEY);
        if (moodRaw) {
          const parsed = JSON.parse(moodRaw) as { date: string; value: number };
          if (parsed?.date === new Date().toDateString() && parsed.value >= 1 && parsed.value <= 5) {
            setMood(parsed.value);
          }
        }
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
  }, [speechError]);

  // Pulses the record button in the log popup with a soft red glow while
  // a recording is in progress.
  const recordPulse = usePulseLoop(isRecording);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(""), 4000);
    return () => clearTimeout(t);
  }, [error]);

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
      if (!output?.isSymptom || (!output?.title && !output?.summary)) {
        setError("That doesn't look like a symptom — try describing how you feel.");
        return;
      }
      const newSummary = output.summary || `- ${text}`;

      // If we already have a draft open, treat this as "Add more detail":
      // merge any new bullets in, dropping duplicates / overlaps.
      if (pending) {
        const incoming = parseBullets(newSummary);
        const merged = parseBullets(pending.summary);
        for (const b of incoming) {
          if (!overlapsExisting(b, merged)) merged.push(b);
        }
        setPending({ ...pending, summary: bulletsToSummary(merged) });
        setDraft("");
        setShowLogModal(false);
        return;
      }

      setShowLogModal(false);
      setPending({
        id: null,
        raw: text,
        title: output.title || "Untitled symptom",
        summary: newSummary,
        severity: output.severity || 3,
        photoUris: [],
        timestamp: null,
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
    const isEdit = !!pending.id;
    const entry: Entry = {
      id: pending.id || Date.now().toString(),
      title: pending.title.trim() || "Untitled symptom",
      summary: pending.summary,
      severity: pending.severity,
      rawText: pending.raw,
      photoUris: pending.photoUris.length ? pending.photoUris : undefined,
      timestamp: pending.timestamp || new Date().toISOString(),
    };
    setEntries((prev) =>
      isEdit ? prev.map((e) => (e.id === entry.id ? entry : e)) : [entry, ...prev]
    );
    setPending(null);
  };

  const cancelPending = () => {
    setPending(null);
  };

  const startEditEntry = (e: Entry) => {
    setPending({
      id: e.id,
      raw: e.rawText,
      title: e.title,
      summary: e.summary,
      severity: e.severity,
      photoUris: e.photoUris ? [...e.photoUris] : [],
      timestamp: e.timestamp,
    });
  };

  const attachPhoto = async (source: "camera" | "library") => {
    try {
      const perm = source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          source === "camera" ? "Camera Permission Required" : "Photo Library Permission Required",
          "Please allow access in Settings.",
        );
        return;
      }
      const result = source === "camera"
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.7, allowsEditing: false })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7, allowsEditing: false });
      if (result.canceled || !result.assets?.[0]) return;
      const uri = result.assets[0].uri;
      setPending((prev) => (prev ? { ...prev, photoUris: [uri] } : prev));
    } catch (err: any) {
      Alert.alert("Couldn't attach photo", err?.message || "Please try again.");
    }
  };

  const removePhotoAt = (index: number) => {
    setPending((prev) =>
      prev ? { ...prev, photoUris: prev.photoUris.filter((_, i) => i !== index) } : prev
    );
  };

  const pickMood = (value: number) => {
    setMood(value);
    AsyncStorage.setItem(
      MOOD_STORAGE_KEY,
      JSON.stringify({ date: new Date().toDateString(), value })
    );
    setShowMoodModal(false);
  };

  const closeLogModal = () => {
    if (isRecording) return;
    setShowLogModal(false);
    setShowText(false);
    setDraft("");
    setError("");
  };

  const deleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const todayKey = new Date().toDateString();
  const todayCount = entries.filter((e) => {
    try { return new Date(e.timestamp).toDateString() === todayKey; } catch { return false; }
  }).length;

  return (
    <View style={styles.container}>
      <BackButton label="SenseGuard" to="Home" />

      <View style={styles.top}>
        <TouchableOpacity
          style={[
            styles.summaryCard,
            mood ? { borderLeftColor: MOOD_COLOURS[mood - 1] } : null,
          ]}
          onPress={() => setShowMoodModal(true)}
          activeOpacity={0.85}
        >
          <View style={styles.summarySplit}>
            <View style={styles.summaryLeft}>
              <Text style={styles.summaryTitle}>Today's Mood</Text>
              <Text style={styles.summaryDate}>{formatTodayLabel()}</Text>
            </View>

            <View style={styles.summaryRight}>
              <View
                style={[
                  styles.moodEmojiCircle,
                  mood
                    ? { backgroundColor: `${MOOD_COLOURS[mood - 1]}26`, borderColor: MOOD_COLOURS[mood - 1] }
                    : null,
                ]}
              >
                <Text style={styles.moodHeroEmoji}>
                  {mood ? MOOD_EMOJI[mood - 1] : "＋"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.changeChip}>
            <Pencil size={14} color={colors.text} />
            <Text style={styles.changeChipText} numberOfLines={1}>Tap to set</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.entryScroll}
        contentContainerStyle={styles.entryScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {entries.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No Symptoms Logged</Text>
          </View>
        ) : (
          <View style={styles.entryList}>
            {entries.map((e) => (
              <View key={e.id} style={styles.entryRow}>
                <TouchableOpacity
                  onPress={() => startEditEntry(e)}
                  style={styles.entryMain}
                  activeOpacity={0.7}
                  accessibilityLabel={`Edit ${e.title}`}
                >
                  {e.photoUris?.[0] ? (
                    <Image source={{ uri: e.photoUris[0] }} style={styles.entryPhoto} resizeMode="cover" />
                  ) : (
                    <View style={styles.entryPhotoPlaceholder}>
                      <Text style={styles.entryPhotoPlaceholderText}>No photo</Text>
                    </View>
                  )}
                  <View style={styles.entryMeta}>
                    <Text style={styles.entryTitle} numberOfLines={1}>{e.title}</Text>
                    <Text style={styles.entryDate}>{formatWhen(e.timestamp)}</Text>
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
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => deleteEntry(e.id)}
                  style={styles.entryDeleteBtn}
                  accessibilityLabel={`Delete ${e.title}`}
                  hitSlop={8}
                >
                  <Trash2 size={20} color={colors.destructive} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          onPress={() => setShowLogModal(true)}
          style={styles.addBtn}
          activeOpacity={0.7}
        >
          <Plus size={22} color={ACCENT} />
          <Text style={styles.addBtnText}>Log Symptom</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            Linking.openURL("tel:").catch(() =>
              Alert.alert("Couldn't open dialer", "Please open your phone app manually.")
            )
          }
          style={styles.emergencyBubble}
          activeOpacity={0.7}
          accessibilityLabel="Call emergency 000"
          accessibilityRole="button"
        >
          <Phone size={22} color={colors.destructive} />
          <Text style={styles.emergencyBubbleText}>
            Emergency? Call <Text style={styles.emergencyBubbleNumber}>000</Text>
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showMoodModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMoodModal(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.moodModalCard}>
            <View style={styles.logModalHeader}>
              <Text style={styles.modalHeading}>How are you feeling?</Text>
              <TouchableOpacity onPress={() => setShowMoodModal(false)} style={styles.closeBtn}>
                <X size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={styles.moodColumn}>
              {[1, 2, 3, 4, 5].map((n) => {
                const c = MOOD_COLOURS[n - 1];
                const active = mood === n;
                return (
                  <TouchableOpacity
                    key={n}
                    onPress={() => pickMood(n)}
                    style={[
                      styles.moodBtn,
                      {
                        backgroundColor: active ? c : "transparent",
                        borderColor: c,
                      },
                    ]}
                  >
                    <Text style={styles.moodEmoji}>{MOOD_EMOJI[n - 1]}</Text>
                    <Text style={[styles.moodLabel, { color: active ? colors.background : colors.text }]}>
                      {MOOD_LABELS[n - 1]}
                    </Text>
                    <Text style={[styles.moodNum, { color: active ? colors.background : colors.textMuted }]}>{n}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showLogModal}
        transparent
        animationType="fade"
        onRequestClose={closeLogModal}
      >
        <View style={styles.overlay}>
          <View style={styles.logModalCard}>
            <Text
              style={[styles.modalHeading, error && styles.modalHeadingError]}
              numberOfLines={2}
            >
              {error || "How would you like to log?"}
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
              {isRecording && (
                <Animated.View
                  pointerEvents="none"
                  style={[styles.recordBtnPulse, { opacity: recordPulse }]}
                />
              )}
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
                style={styles.typeBtn}
                disabled={processing}
              >
                <Keyboard size={18} color={ACCENT} />
                <Text style={styles.typeBtnText}>Type</Text>
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
                  autoFocus
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

            <TouchableOpacity
              onPress={closeLogModal}
              style={styles.logCloseBtn}
              disabled={isRecording}
              accessibilityLabel="Close"
            >
              <Text style={[styles.logCloseBtnText, isRecording && { opacity: 0.4 }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={pending !== null && !showLogModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={cancelPending}
      >
        <View
          style={[
            styles.confirmOverlay,
            {
              paddingTop: insets.top + 14,
              paddingBottom: Math.max(insets.bottom, 6) + 14,
            },
          ]}
        >
          <View style={styles.confirmModalCard}>
            <Text style={styles.confirmModalHeading}>
              {pending?.id ? "Edit Symptom" : "Log a Symptom"}
            </Text>
            <TextInput
              value={pending?.title || ""}
              onChangeText={(t) => pending && setPending({ ...pending, title: t })}
              style={styles.modalTitleInput}
              placeholder="Title"
              placeholderTextColor={colors.textCaption}
            />

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

            <Text style={styles.modalLabel}>Details</Text>
            <View style={styles.detailsFlex}>
              <ScrollView
                style={styles.detailsScroll}
                contentContainerStyle={styles.detailsScrollContent}
                keyboardShouldPersistTaps="handled"
              >
                {(() => {
                  const bullets = parseBullets(pending?.summary || "");
                  return (
                    <View style={styles.bubbleWrap}>
                      {bullets.length === 0 && (
                        <Text style={styles.modalEmptyHint}>No details yet</Text>
                      )}
                      {bullets.map((b, i) => (
                        <View key={`${i}-${b}`} style={styles.bubble}>
                          <Text style={styles.bubbleText}>{b}</Text>
                          <TouchableOpacity
                            onPress={() => {
                              if (!pending) return;
                              const next = bullets.filter((_, idx) => idx !== i);
                              setPending({ ...pending, summary: bulletsToSummary(next) });
                            }}
                            style={styles.bubbleRemove}
                            accessibilityLabel={`Remove ${b}`}
                            hitSlop={8}
                          >
                            <X size={20} color={colors.text} />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  );
                })()}
              </ScrollView>
            </View>

            <View style={styles.actionRow}>
              <View style={styles.actionCol}>
                <TouchableOpacity
                  onPress={() => setShowLogModal(true)}
                  style={styles.actionBtn}
                  activeOpacity={0.75}
                  accessibilityLabel="Add more detail"
                >
                  <Text style={styles.actionBtnText}>Add more detail</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => attachPhoto("camera")}
                  style={styles.actionBtn}
                  activeOpacity={0.75}
                  accessibilityLabel="Attach a photo"
                >
                  <Text style={styles.actionBtnText}>Attach a photo</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.photoArea}>
                {pending?.photoUris.length ? (
                  <>
                    <Image
                      source={{ uri: pending.photoUris[0] }}
                      style={styles.photoFill}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      onPress={() => removePhotoAt(0)}
                      style={styles.photoRemoveBtn}
                      accessibilityLabel="Remove photo"
                    >
                      <X size={16} color={colors.text} />
                    </TouchableOpacity>
                  </>
                ) : (
                  <Text style={styles.photoAreaEmptyText}>No photo attached</Text>
                )}
              </View>
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={cancelPending} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmLog} style={styles.logBtnConfirm}>
                <Text style={styles.logBtnConfirmText}>{pending?.id ? "Save" : "Log it"}</Text>
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

  top: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 10,
  },

  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderLeftWidth: 4,
    borderLeftColor: ACCENT,
    gap: 10,
  },
  summarySplit: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 14,
  },
  summaryLeft: { flex: 3, gap: 8, alignItems: "flex-start", justifyContent: "center" },
  summaryRight: { flex: 2, gap: 8, alignItems: "center", justifyContent: "center" },
  summaryTitle: { color: colors.text, fontSize: 20, fontWeight: "700" },
  summaryDate: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  moodEmojiCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.12)",
  },
  moodHeroEmoji: { fontSize: 32, lineHeight: 36 },
  changeChip: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    marginTop: 4,
  },
  changeChipText: { color: colors.text, fontSize: 14, fontWeight: "700" },

  entryScroll: { flex: 1, paddingHorizontal: 20 },
  entryScrollContent: { flexGrow: 1, gap: 8, paddingBottom: 8 },

  emptyBox: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.border,
    paddingVertical: 28,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 140,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 17,
    fontWeight: "500",
  },

  entryList: { gap: 8 },
  entryRow: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: colors.card,
    borderRadius: 10,
    overflow: "hidden",
    minHeight: 72,
  },
  entryMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "stretch",
  },
  entryPhoto: {
    aspectRatio: 1,
    alignSelf: "stretch",
  },
  entryPhotoPlaceholder: {
    aspectRatio: 1,
    alignSelf: "stretch",
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingHorizontal: 4,
  },
  entryPhotoPlaceholderText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  entryMeta: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: "center",
    gap: 4,
  },
  entryTitle: { color: colors.text, fontSize: 17, fontWeight: "700" },
  entryDate: { color: colors.textMuted, fontSize: 15 },
  entryDots: { flexDirection: "row", gap: 6, marginTop: 4 },
  entryDot: { width: 12, height: 12, borderRadius: 6 },
  entryDeleteBtn: {
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    gap: 10,
  },

  addBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: ACCENT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  addBtnText: { color: ACCENT, fontSize: 18, fontWeight: "600" },

  emergencyBubble: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.primary + "44",
  },
  emergencyBubbleText: { color: colors.textMuted, fontSize: 17, fontWeight: "600" },
  emergencyBubbleNumber: { color: colors.destructive, fontSize: 20, fontWeight: "800" },

  recordBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: ACCENT,
    borderRadius: 14,
    paddingVertical: 16,
    overflow: "hidden",
  },
  recordBtnActive: { backgroundColor: ACCENT_DEEP },
  recordBtnPulse: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.destructive,
  },
  recordBtnDisabled: { opacity: 0.6 },
  recordBtnText: { color: colors.background, fontSize: 18, fontWeight: "700" },

  typeBtn: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: ACCENT,
    backgroundColor: "transparent",
  },
  typeBtnText: { color: ACCENT, fontSize: 15, fontWeight: "700" },
  logCloseBtn: {
    alignSelf: "stretch",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    marginTop: 4,
  },
  logCloseBtnText: { color: colors.textMuted, fontSize: 16, fontWeight: "600" },
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
    backgroundColor: ACCENT,
  },
  processBtnDisabled: { opacity: 0.5 },
  processBtnText: { color: colors.background, fontSize: 16, fontWeight: "700" },

  cardSub: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  error: { color: colors.destructive, fontSize: 14, textAlign: "center" },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  logModalCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    gap: 10,
  },
  logModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  closeBtn: { paddingHorizontal: 6, paddingVertical: 4 },

  moodModalCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  moodColumn: { gap: 8, marginTop: 4 },
  moodBtn: {
    width: "100%",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  moodEmoji: { fontSize: 30 },
  moodLabel: { flex: 1, fontSize: 17, fontWeight: "700", letterSpacing: 0.2 },
  moodNum: {
    fontSize: 14,
    fontWeight: "800",
    minWidth: 28,
    textAlign: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },

  modalCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    gap: 8,
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 12,
  },
  confirmModalCard: {
    flex: 1,
    width: "100%",
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  confirmModalHeading: {
    color: ACCENT,
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    paddingTop: 4,
    paddingBottom: 2,
  },
  detailsFlex: { flex: 1, minHeight: 100 },
  detailsScroll: {
    flex: 1,
    backgroundColor: "transparent",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailsScrollContent: { padding: 10 },
  modalHeading: { color: colors.text, fontSize: 20, fontWeight: "700", marginBottom: 6, textAlign: "center" },
  modalHeadingError: { color: colors.destructive },
  modalLabel: { color: colors.text, fontSize: 14, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4, marginTop: 8 },
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
  modalEmptyHint: { color: colors.textCaption, fontSize: 14, fontStyle: "italic", paddingVertical: 4 },
  bubbleWrap: {
    gap: 8,
    paddingVertical: 4,
  },
  bubble: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "stretch",
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  bubbleText: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: "500",
    paddingLeft: 14,
    paddingRight: 10,
    paddingVertical: 10,
    textAlignVertical: "center",
  },
  bubbleRemove: {
    aspectRatio: 1,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.destructive,
  },
  actionRow: { flexDirection: "row", gap: 10, alignItems: "stretch" },
  actionCol: { flex: 1, gap: 10 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    borderWidth: 2,
    borderColor: ACCENT,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 10,
  },
  actionBtnText: { color: ACCENT, fontSize: 17, fontWeight: "700" },
  photoArea: {
    flex: 1,
    aspectRatio: 1,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  photoFill: { ...StyleSheet.absoluteFillObject, borderRadius: 10 },
  photoAreaEmptyText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
  photoThumbRow: { gap: 6, alignItems: "center", paddingHorizontal: 4 },
  photoThumb: { width: 70, height: 70, borderRadius: 10, position: "relative", overflow: "hidden" },
  photoPreview: { width: "100%", height: "100%", borderRadius: 12 },
  photoRemoveBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalSevRow: { flexDirection: "row", justifyContent: "space-around", alignItems: "center", marginTop: 2, paddingHorizontal: 4 },
  modalSevBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  modalSevNum: { fontSize: 15, fontWeight: "700" },
  modalBtns: { flexDirection: "row", gap: 10, marginTop: 6 },
  cancelBtn: { flex: 1, paddingVertical: 11, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: "center" },
  cancelText: { color: colors.textMuted, fontSize: 16, fontWeight: "600" },
  logBtnConfirm: { flex: 1, paddingVertical: 11, borderRadius: 12, backgroundColor: ACCENT, alignItems: "center" },
  logBtnConfirmText: { color: colors.background, fontSize: 16, fontWeight: "700" },
});
