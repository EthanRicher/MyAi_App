import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HelpCircle, Plus, Clock, Check } from "lucide-react-native";
import { BackButton } from "../components/BackButton";
import { RootStackParamList } from "../navigation/AppNavigator";
import { colors } from "../theme";

type Nav = NativeStackNavigationProp<RootStackParamList, "MedView">;

interface Med {
  id: string;
  name: string;
  dose: string;
  time: string;
  taken: boolean;
}

const initialMeds: Med[] = [
  { id: "1", name: "Metformin", dose: "500mg", time: "Morning", taken: true },
  { id: "2", name: "Amlodipine", dose: "5mg", time: "Morning", taken: true },
  { id: "3", name: "Aspirin", dose: "100mg", time: "Afternoon", taken: true },
  { id: "4", name: "Atorvastatin", dose: "20mg", time: "Evening", taken: false },
  { id: "5", name: "Vitamin D", dose: "1000IU", time: "Evening", taken: false },
];

export function MedViewLanding() {
  const navigation = useNavigation<Nav>();
  const [meds] = useState(initialMeds);
  const taken = meds.filter((m) => m.taken).length;
  const pct = (taken / meds.length) * 100;

  return (
    <View style={styles.container}>
      <BackButton label="Home" to="Home" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>MedView</Text>

        <View style={styles.scheduleCard}>
          <View style={styles.scheduleHeader}>
            <Text style={styles.scheduleTitle}>Today's Schedule</Text>
            <TouchableOpacity onPress={() => navigation.navigate("MedViewSchedule")}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.scheduleCount}>{taken} of {meds.length} medications taken</Text>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
          </View>
        </View>

        <View style={styles.medList}>
          {meds.map((m) => (
            <TouchableOpacity
              key={m.id}
              onPress={() => navigation.navigate("MedViewDetail", { id: m.id })}
              style={styles.medRow}
              accessibilityLabel={`${m.name} ${m.dose}`}
            >
              <View style={[styles.dot, { backgroundColor: m.taken ? colors.green : colors.orange }]} />
              <View style={styles.medInfo}>
                <Text style={styles.medName}>{m.name}</Text>
                <Text style={styles.medSub}>{m.dose} · {m.time}</Text>
              </View>
              {m.taken
                ? <Check size={22} color={colors.green} />
                : <Clock size={22} color={colors.orange} />
              }
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate("MedViewAdd")}
          style={styles.addBtn}
          accessibilityLabel="Add medication"
        >
          <Plus size={22} color={colors.green} />
          <Text style={styles.addBtnText}>Add Medication</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("MedViewChat")}
          style={styles.explainBtn}
          accessibilityLabel="Explain"
        >
          <HelpCircle size={26} color={colors.green} />
          <Text style={styles.explainText}>Explain</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>AI helps you understand. Always confirm with your doctor.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, gap: 10 },
  heading: { color: colors.text, fontSize: 26, fontWeight: "700" },
  scheduleCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.green,
  },
  scheduleHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  scheduleTitle: { color: colors.text, fontSize: 20, fontWeight: "700" },
  viewAll: { color: colors.green, fontSize: 16, fontWeight: "600" },
  scheduleCount: { color: colors.textMuted, fontSize: 17 },
  progressBg: { width: "100%", height: 6, backgroundColor: colors.background, borderRadius: 3, marginTop: 8 },
  progressFill: { height: "100%", backgroundColor: colors.green, borderRadius: 3 },
  medList: { gap: 8 },
  medRow: {
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
  medInfo: { flex: 1 },
  medName: { color: colors.text, fontSize: 18, fontWeight: "600" },
  medSub: { color: colors.textMuted, fontSize: 15 },
  addBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.green,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  addBtnText: { color: colors.green, fontSize: 18, fontWeight: "600" },
  explainBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  explainText: { color: colors.textMuted, fontSize: 17 },
  disclaimer: { color: colors.textCaption, textAlign: "center", fontSize: 14, lineHeight: 21 },
});
