import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { Check, Clock } from "lucide-react-native";
import { BackButton } from "../../../components/BackButton";
import { colors } from "../../../theme";
import { useMedications } from "../hooks/useMedication";

export function MedViewSchedule() {
  const { medications, toggleTaken } = useMedications();

  const schedule = medications.flatMap((med) =>
    med.times.map((time, index) => ({
      medId: med.id,
      name: med.name,
      dose: med.dose,
      time,
      taken: med.taken[index],
      index,
    }))
  );

  const total = schedule.length;
  const taken = schedule.filter((s) => s.taken).length;
  const pct = total ? Math.round((taken / total) * 100) : 0;

  return (
    <View style={styles.container}>
      <BackButton label="MedView" to="MedView" />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Today's Schedule</Text>

        <View style={styles.progressCard}>
          <Text style={styles.progressLabel}>
            {taken} of {total} taken
          </Text>

          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
          </View>
        </View>

        <View style={styles.medList}>
          {schedule.map((item, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => toggleTaken(item.medId, item.index)}
              style={styles.medRow}
            >
              <View
                style={[
                  styles.checkCircle,
                  {
                    backgroundColor: item.taken ? colors.green : "transparent",
                    borderColor: item.taken ? colors.green : colors.border,
                  },
                ]}
              >
                {item.taken ? (
                  <Check size={20} color={colors.text} />
                ) : (
                  <Clock size={20} color={colors.orange} />
                )}
              </View>

              <View style={styles.medInfo}>
                <Text style={[styles.medName, item.taken && styles.medNameTaken]}>
                  {item.name}
                </Text>
                <Text style={styles.medDose}>
                  {item.dose} · {item.time}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 16 },

  heading: { color: colors.text, fontSize: 26, fontWeight: "700" },

  progressCard: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
  },

  progressLabel: { color: colors.textMuted, marginBottom: 8 },

  progressBg: {
    height: 10,
    backgroundColor: colors.background,
    borderRadius: 5,
  },

  progressFill: {
    height: "100%",
    backgroundColor: colors.green,
    borderRadius: 5,
  },

  medList: { gap: 10 },

  medRow: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
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

  medName: { color: colors.text, fontSize: 18 },
  medNameTaken: { textDecorationLine: "line-through", opacity: 0.6 },

  medDose: { color: colors.textMuted },
});