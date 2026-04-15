import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { Phone } from "lucide-react-native";
import { BackButton } from "../../../components/BackButton";
import { BackendRequiredModal } from "../../../components/BackendRequiredModal";
import { colors } from "../../../theme";

const moods = [
  { label: "Great", color: "#4CAF50", emoji: "😄" },
  { label: "OK", color: "#8BC34A", emoji: "🙂" },
  { label: "Low", color: "#FF9800", emoji: "😔" },
  { label: "Worried", color: "#FF5722", emoji: "😟" },
  { label: "Struggling", color: "#F44336", emoji: "😢" },
];

interface Entry { symptom: string; date: string; severity: number; }

export function SenseGuard() {
  const [selectedMood, setSelectedMood] = useState<string | null>("Low");
  const [symptom, setSymptom] = useState("");
  const [severity, setSeverity] = useState(3);
  const [entries, setEntries] = useState<Entry[]>([
    { symptom: "Headache", date: "27 Mar", severity: 3 },
    { symptom: "Dizziness", date: "25 Mar", severity: 2 },
  ]);
  const [showBackend, setShowBackend] = useState(false);

  const logSymptom = () => {
    if (!symptom.trim()) return;
    setEntries([{ symptom: symptom.trim(), date: "28 Mar", severity }, ...entries.slice(0, 1)]);
    setSymptom("");
    setSeverity(3);
    Alert.alert("Symptom Logged");
  };

  return (
    <View style={styles.container}>
      <BackButton label="SenseGuard" to="Home" />
      <ScrollView contentContainerStyle={styles.content}>

        <View style={styles.emergency}>
          <Phone size={20} color={colors.text} />
          <Text style={styles.emergencyText}>Emergency? Call 000 immediately</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardHeading}>How are you feeling?</Text>
          <View style={styles.moodRow}>
            {moods.map((m) => (
              <TouchableOpacity
                key={m.label}
                onPress={() => setSelectedMood(m.label)}
                style={styles.moodBtn}
                accessibilityLabel={`Mood: ${m.label}`}
              >
                <View style={[
                  styles.moodCircle,
                  { borderColor: m.color, backgroundColor: selectedMood === m.label ? m.color + "30" : "transparent" },
                ]}>
                  <Text style={styles.moodEmoji}>{m.emoji}</Text>
                </View>
                <Text style={styles.moodLabel}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardHeading}>Log a Symptom</Text>
          <TextInput
            value={symptom}
            onChangeText={setSymptom}
            placeholder="Describe your symptom"
            placeholderTextColor={colors.textCaption}
            style={styles.input}
            accessibilityLabel="Symptom description"
          />
          <View style={styles.severityRow}>
            <Text style={styles.severityLabel}>Severity</Text>
            <View style={styles.severityBtns}>
              {[1, 2, 3, 4, 5, 6].map((n) => {
                const btnColors = ["#4CAF50", "#8BC34A", "#CDDC39", "#FFC107", "#FF9800", "#E53935"];
                const c = btnColors[n - 1];
                return (
                  <TouchableOpacity
                    key={n}
                    onPress={() => setSeverity(n)}
                    style={[styles.severityBtn, {
                      backgroundColor: n <= severity ? c : "transparent",
                      borderColor: n <= severity ? c : colors.border,
                    }]}
                    accessibilityLabel={`Severity ${n}`}
                  >
                    <Text style={[styles.severityNum, { color: n <= severity ? colors.background : colors.textCaption }]}>{n}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <TouchableOpacity onPress={logSymptom} style={styles.logBtn} accessibilityLabel="Log symptom">
            <Text style={styles.logBtnText}>Log Symptom</Text>
          </TouchableOpacity>
        </View>

        <View>
          <Text style={styles.sectionHeading}>Recent Entries</Text>
          <View style={styles.entryList}>
            {entries.slice(0, 2).map((e, i) => (
              <View key={i} style={styles.entryRow}>
                <View>
                  <Text style={styles.entrySymptom}>{e.symptom}</Text>
                  <Text style={styles.entryDate}>{e.date}</Text>
                </View>
                <View style={styles.entryDots}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <View key={n} style={[styles.entryDot, { backgroundColor: n <= e.severity ? colors.orange : colors.border }]} />
                  ))}
                </View>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity onPress={() => setShowBackend(true)} style={styles.apptBtn} accessibilityLabel="Prepare for my appointment">
          <Text style={styles.apptBtnText}>Appointment Prep</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>AI helps you understand. Always confirm with your doctor.</Text>
      </ScrollView>

      <BackendRequiredModal
        open={showBackend}
        onClose={() => setShowBackend(false)}
        description="Generating an appointment summary requires AI to analyse your logged symptoms, mood history, and medications to create a personalised report for your doctor."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, gap: 12 },
  heading: { color: colors.text, fontSize: 24, fontWeight: "700" },
  emergency: { backgroundColor: colors.destructive, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 8 },
  emergencyText: { color: colors.text, fontSize: 16, fontWeight: "600" },
  card: { backgroundColor: colors.card, borderRadius: 12, padding: 12 },
  cardHeading: { color: colors.text, fontSize: 17, fontWeight: "700", marginBottom: 10 },
  moodRow: { flexDirection: "row", justifyContent: "space-between" },
  moodBtn: { alignItems: "center", gap: 4 },
  moodCircle: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  moodEmoji: { fontSize: 24 },
  moodLabel: { color: colors.textMuted, fontSize: 12 },
  input: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, color: colors.text, fontSize: 16, marginBottom: 8 },
  severityRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  severityLabel: { color: colors.textMuted, fontSize: 15 },
  severityBtns: { flexDirection: "row", gap: 6 },
  severityBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  severityNum: { fontSize: 14, fontWeight: "700" },
  logBtn: { width: "100%", paddingVertical: 10, borderRadius: 8, backgroundColor: colors.orange, alignItems: "center" },
  logBtnText: { color: colors.background, fontSize: 17, fontWeight: "700" },
  sectionHeading: { color: colors.text, fontSize: 19, fontWeight: "700", marginBottom: 8 },
  entryList: { gap: 8 },
  entryRow: { backgroundColor: colors.card, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  entrySymptom: { color: colors.text, fontSize: 17, fontWeight: "600" },
  entryDate: { color: colors.textCaption, fontSize: 14 },
  entryDots: { flexDirection: "row", gap: 6 },
  entryDot: { width: 10, height: 10, borderRadius: 5 },
  apptBtn: { width: "100%", paddingVertical: 12, borderRadius: 12, backgroundColor: colors.orange, alignItems: "center" },
  apptBtnText: { color: colors.background, fontSize: 18, fontWeight: "700" },
  disclaimer: { color: colors.textCaption, textAlign: "center", fontSize: 13, lineHeight: 20 },
});
