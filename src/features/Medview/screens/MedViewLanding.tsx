import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HelpCircle, Plus, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackButton } from "../../../components/BackButton";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors } from "../../../theme";
import { useMedications } from "../hooks/useMedication";
import { Medication } from "../models/Medication";

type Nav = NativeStackNavigationProp<RootStackParamList, "MedView">;

export function MedViewLanding() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { medications } = useMedications();
  const [explainMode, setExplainMode] = useState(false);

  const meds: Medication[] = medications;

  const total = meds.reduce((sum, m) => sum + (m.times?.length || 0), 0);
  const taken = meds.reduce((sum, m) => sum + (m.taken?.filter(t => t).length || 0), 0);
  const pct = total ? (taken / total) * 100 : 0;

  const hasMeds = meds.length > 0;

  function handleExplainPress() {
    if (!hasMeds) return;
    setExplainMode((prev) => !prev);
  }

  function handleExplainMed(med: Medication) {
    setExplainMode(false);
    navigation.navigate("MedViewChat", { med });
  }

  return (
    <View style={styles.container}>
      <BackButton label="MedView" to="Home" />

      <View style={styles.top}>
        <View style={styles.scheduleCard}>
          <View style={styles.scheduleHeader}>
            <Text style={styles.scheduleTitle}>Today's Schedule</Text>
            <TouchableOpacity onPress={() => navigation.navigate("MedViewSchedule")}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.scheduleCount}>
            {taken} of {total} doses taken
          </Text>

          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
          </View>
        </View>

      </View>

      <ScrollView
        style={styles.medList}
        contentContainerStyle={styles.medListContent}
        showsVerticalScrollIndicator={false}
      >
        {meds.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No Medication</Text>
          </View>
        )}
        {meds.map((m) => (
          <TouchableOpacity
            key={m.id}
            onPress={() => {
              if (explainMode) {
                handleExplainMed(m);
              } else {
                navigation.navigate("MedViewDetail", { id: m.id });
              }
            }}
            style={[styles.medRow, explainMode && styles.medRowHighlighted]}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.dot,
                { backgroundColor: m.taken?.some(t => t) ? colors.green : colors.orange },
              ]}
            />
            <View style={styles.medInfo}>
              <Text style={styles.medName}>{m.name}</Text>
              <Text style={styles.medSub}>{m.dose} · {m.dosesPerDay} times daily</Text>
            </View>
            {explainMode && (
              <View style={styles.explainBubble}>
                <Text style={styles.explainBubbleText}>Explain</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          onPress={() => navigation.navigate("MedViewAdd")}
          style={styles.addBtn}
        >
          <Plus size={22} color={colors.green} />
          <Text style={styles.addBtnText}>Add Medication</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleExplainPress}
          style={[
            styles.explainBtn,
            !hasMeds && styles.explainBtnDisabled,
            explainMode && styles.explainBtnActive,
          ]}
          disabled={!hasMeds}
          activeOpacity={hasMeds ? 0.7 : 1}
        >
          {explainMode ? (
            <X size={22} color={colors.background} />
          ) : (
            <HelpCircle size={22} color={hasMeds ? colors.green : colors.textMuted} />
          )}
          <Text style={[
            styles.explainText,
            !hasMeds && styles.explainTextDisabled,
            explainMode && styles.explainTextActive,
          ]}>
            {explainMode ? "Cancel" : "Explain My Medication"}
          </Text>
        </TouchableOpacity>
      </View>
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

  heading: { color: colors.text, fontSize: 26, fontWeight: "700" },

  scheduleCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.green,
  },

  scheduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },

  scheduleTitle: { color: colors.text, fontSize: 20, fontWeight: "700" },
  viewAll: { color: colors.green, fontSize: 16, fontWeight: "600" },
  scheduleCount: { color: colors.textMuted, fontSize: 17 },

  progressBg: {
    width: "100%",
    height: 6,
    backgroundColor: colors.background,
    borderRadius: 3,
    marginTop: 8,
  },

  progressFill: {
    height: "100%",
    backgroundColor: colors.green,
    borderRadius: 3,
  },

  medList: {
    flex: 1,
    paddingHorizontal: 20,
  },

  medListContent: {
    gap: 8,
    paddingBottom: 8,
  },

  medRow: {
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },

  medRowHighlighted: {
    borderColor: colors.green,
    backgroundColor: colors.card,
  },

  dot: { width: 12, height: 12, borderRadius: 6 },

  medInfo: { flex: 1 },

  medName: { color: colors.text, fontSize: 18, fontWeight: "600" },
  medSub: { color: colors.textMuted, fontSize: 15 },

  explainBubble: {
    backgroundColor: colors.green,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  explainBubbleText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: "700",
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

  explainBtnDisabled: {
    opacity: 0.4,
  },

  explainBtnActive: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },

  explainText: { color: colors.green, fontSize: 17, fontWeight: "600" },

  explainTextDisabled: { color: colors.textMuted },

  explainTextActive: { color: colors.background },

  emptyBox: {
    borderRadius: 10,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.border,
    paddingVertical: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyText: {
    color: colors.textMuted,
    fontSize: 17,
    fontWeight: "500",
  },
});
