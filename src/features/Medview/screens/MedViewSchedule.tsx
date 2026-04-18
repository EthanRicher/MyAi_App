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

  const sorted = [...schedule].sort((a, b) => a.time.localeCompare(b.time));

  const groups: { time: string; items: typeof sorted }[] = [];
  for (const item of sorted) {
    const last = groups[groups.length - 1];
    if (last && last.time === item.time) {
      last.items.push(item);
    } else {
      groups.push({ time: item.time, items: [item] });
    }
  }

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
          {groups.map((group) =>
            group.items.length === 1 ? (
              <MedRow
                key={`${group.items[0].medId}-${group.items[0].index}`}
                item={group.items[0]}
                onToggle={toggleTaken}
              />
            ) : (
              <View key={group.time} style={styles.timeGroup}>
                <Text style={styles.timeGroupLabel}>{group.time}</Text>
                {group.items.map((item) => (
                  <MedRow
                    key={`${item.medId}-${item.index}`}
                    item={item}
                    onToggle={toggleTaken}
                    hideTime
                  />
                ))}
              </View>
            )
          )}
        </View>
      </ScrollView>
    </View>
  );
}

type ScheduleItem = {
  medId: string;
  name: string;
  dose: string;
  time: string;
  taken: boolean;
  index: number;
};

function MedRow({
  item,
  onToggle,
  hideTime,
}: {
  item: ScheduleItem;
  onToggle: (medId: string, index: number) => void;
  hideTime?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={() => onToggle(item.medId, item.index)}
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
          {item.dose}{hideTime ? "" : ` · ${item.time}`}
        </Text>
      </View>
    </TouchableOpacity>
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

  timeGroup: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding: 10,
    gap: 8,
  },

  timeGroupLabel: {
    color: colors.green,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
    paddingHorizontal: 4,
  },

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
