import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { Check, Clock, Sun, Sunset, Moon } from "lucide-react-native";
import { BackButton } from "../../../components/BackButton";
import { colors } from "../../../theme";
import { useMedications } from "../hooks/useMedication";

type Med = {
  id: string;
  name: string;
  dose: string;
  time: string;
  taken: boolean;
};

export function MedViewSchedule() {
  const { medications, toggleTaken } = useMedications();

  const groups = [
    { label: "Morning", icon: Sun, meds: medications.filter((m: Med) => m.time === "Morning") },
    { label: "Afternoon", icon: Sunset, meds: medications.filter((m: Med) => m.time === "Afternoon") },
    { label: "Evening", icon: Moon, meds: medications.filter((m: Med) => m.time === "Evening") },
  ];

  const total = medications.length;
  const taken = medications.filter((m: Med) => m.taken).length;
  const pct = total ? Math.round((taken / total) * 100) : 0;

  return (
    <View style={styles.container}>
      <BackButton label="MedView" to="MedView" />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Today's Schedule</Text>

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>{taken} of {total} taken</Text>
            <Text style={styles.progressPct}>{pct}%</Text>
          </View>

          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
          </View>
        </View>

        {groups.map((g) => (
          <View key={g.label} style={styles.group}>
            <View style={styles.groupHeader}>
              <g.icon size={24} color={colors.orange} />
              <Text style={styles.groupLabel}>{g.label}</Text>
            </View>

            <View style={styles.medList}>
              {g.meds.map((m: Med) => (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => toggleTaken(m.id)}
                  style={styles.medRow}
                  accessibilityLabel={`Toggle ${m.name}`}
                >
                  <View
                    style={[
                      styles.checkCircle,
                      {
                        backgroundColor: m.taken ? colors.green : "transparent",
                        borderColor: m.taken ? colors.green : colors.border,
                      },
                    ]}
                  >
                    {m.taken ? (
                      <Check size={20} color={colors.text} />
                    ) : (
                      <Clock size={20} color={colors.orange} />
                    )}
                  </View>

                  <View style={styles.medInfo}>
                    <Text style={[styles.medName, m.taken && styles.medNameTaken]}>
                      {m.name}
                    </Text>
                    <Text style={styles.medDose}>{m.dose}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32, gap: 20 },

  heading: { color: colors.text, fontSize: 26, fontWeight: "700" },

  progressCard: { backgroundColor: colors.card, borderRadius: 16, padding: 20 },

  progressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },

  progressLabel: { color: colors.textMuted, fontSize: 17 },

  progressPct: { color: colors.green, fontSize: 18, fontWeight: "700" },

  progressBg: {
    width: "100%",
    height: 12,
    backgroundColor: colors.background,
    borderRadius: 6,
  },

  progressFill: {
    height: "100%",
    backgroundColor: colors.green,
    borderRadius: 6,
  },

  group: { gap: 12 },

  groupHeader: { flexDirection: "row", alignItems: "center", gap: 8 },

  groupLabel: { color: colors.text, fontSize: 20, fontWeight: "700" },

  medList: { gap: 10 },

  medRow: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  checkCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },

  medInfo: { flex: 1 },

  medName: { color: colors.text, fontSize: 18, fontWeight: "600" },

  medNameTaken: { textDecorationLine: "line-through", opacity: 0.6 },

  medDose: { color: colors.textMuted, fontSize: 16 },
});