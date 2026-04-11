import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { Check, Clock, Sun, Sunset, Moon } from "lucide-react-native";
import { BackButton } from "../../../components/BackButton";
import { colors } from "../../../theme";

interface Med { id: string; name: string; dose: string; taken: boolean; }
interface TimeGroup { label: string; icon: typeof Sun; meds: Med[]; }

export function MedViewSchedule() {
  const [groups, setGroups] = useState<TimeGroup[]>([
    { label: "Morning", icon: Sun, meds: [{ id: "1", name: "Metformin", dose: "500mg", taken: true }, { id: "2", name: "Amlodipine", dose: "5mg", taken: true }] },
    { label: "Afternoon", icon: Sunset, meds: [{ id: "3", name: "Aspirin", dose: "100mg", taken: true }] },
    { label: "Evening", icon: Moon, meds: [{ id: "4", name: "Atorvastatin", dose: "20mg", taken: false }, { id: "5", name: "Vitamin D", dose: "1000IU", taken: false }] },
  ]);

  const total = groups.reduce((s, g) => s + g.meds.length, 0);
  const taken = groups.reduce((s, g) => s + g.meds.filter((m) => m.taken).length, 0);
  const pct = Math.round((taken / total) * 100);

  const toggle = (gi: number, mi: number) => {
    setGroups((prev) =>
      prev.map((g, i) =>
        i === gi ? { ...g, meds: g.meds.map((m, j) => (j === mi ? { ...m, taken: !m.taken } : m)) } : g
      )
    );
  };

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

        {groups.map((g, gi) => (
          <View key={g.label} style={styles.group}>
            <View style={styles.groupHeader}>
              <g.icon size={24} color={colors.orange} />
              <Text style={styles.groupLabel}>{g.label}</Text>
            </View>
            <View style={styles.medList}>
              {g.meds.map((m, mi) => (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => toggle(gi, mi)}
                  style={styles.medRow}
                  accessibilityLabel={`Toggle ${m.name} ${m.taken ? "not taken" : "taken"}`}
                >
                  <View style={[styles.checkCircle, { backgroundColor: m.taken ? colors.green : "transparent", borderColor: m.taken ? colors.green : colors.border }]}>
                    {m.taken ? <Check size={20} color={colors.text} /> : <Clock size={20} color={colors.orange} />}
                  </View>
                  <View style={styles.medInfo}>
                    <Text style={[styles.medName, m.taken && styles.medNameTaken]}>{m.name}</Text>
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
  progressBg: { width: "100%", height: 12, backgroundColor: colors.background, borderRadius: 6 },
  progressFill: { height: "100%", backgroundColor: colors.green, borderRadius: 6 },
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
