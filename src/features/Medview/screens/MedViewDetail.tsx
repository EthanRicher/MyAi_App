import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Pill, Edit, Trash2 } from "lucide-react-native";
import { BackButton } from "../../../components/BackButton";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors } from "../../../theme";
import { useMedications } from "../hooks/useMedication";
import { formatScheduleTime } from "../utils/formatTime";

type Nav = NativeStackNavigationProp<RootStackParamList, "MedViewDetail">;
type Route = RouteProp<RootStackParamList, "MedViewDetail">;

export function MedViewDetail() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { id } = route.params;

  const { getMed, deleteMed } = useMedications();
  const [showConfirm, setShowConfirm] = useState(false);

  const med = getMed(id);

  if (!med) {
    return (
      <View style={styles.container}>
        <BackButton label="MedView" to="MedView" />
        <Text style={{ color: "white", padding: 20 }}>Medication not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BackButton label="MedView" to="MedView" />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.pillIcon}>
              <Pill size={28} color={colors.green} />
            </View>
            <View>
              <Text style={styles.medName}>{med.name}</Text>
              <Text style={styles.medSub}>Tablet · {med.dose}</Text>
            </View>
          </View>

          <Text style={styles.schedule}>
            {med.dosesPerDay} times daily
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardHeading}>Description</Text>
          <ScrollView style={styles.descriptionScroll} nestedScrollEnabled>
            <Text style={styles.cardBody}>
              {med.description || "No description provided."}
            </Text>
          </ScrollView>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardHeading}>Schedule</Text>

          <View style={styles.scheduleRow}>
            {(med.times || []).map((t, i) => (
              <View key={i} style={[styles.timeChip, styles.timeChipActive]}>
                <Text style={styles.timeLabel}>{formatScheduleTime(t)}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => navigation.navigate("MedViewAdd", { med })}
            style={styles.editBtn}
          >
            <Edit size={20} color={colors.green} />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowConfirm(true)} style={styles.removeBtn}>
            <Trash2 size={20} color={colors.destructive} />
            <Text style={styles.removeBtnText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={showConfirm} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Remove {med.name}?</Text>

            <View style={styles.confirmBtns}>
              <TouchableOpacity onPress={() => setShowConfirm(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  deleteMed(id);
                  navigation.navigate("MedView");
                }}
                style={styles.deleteBtn}
              >
                <Text style={styles.deleteText}>Remove</Text>
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

  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32, gap: 20 },

  headerCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderTopWidth: 4,
    borderTopColor: colors.green,
  },

  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 12,
  },

  pillIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.green + "33",
    alignItems: "center",
    justifyContent: "center",
  },

  medName: { color: colors.text, fontSize: 24, fontWeight: "700" },
  medSub: { color: colors.textMuted, fontSize: 17 },

  schedule: { color: colors.textMuted, fontSize: 17 },

  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.primary + "44",
  },

  cardHeading: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },

  descriptionScroll: {
    minHeight: 160,
    maxHeight: 260,
  },

  cardBody: {
    color: colors.textMuted,
    fontSize: 17,
    lineHeight: 27,
  },

  scheduleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  timeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.background,
  },

  timeChipActive: {
    backgroundColor: colors.green + "33",
  },

  timeLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },

  actions: { flexDirection: "row", gap: 12 },

  editBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.green,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  editBtnText: {
    color: colors.green,
    fontSize: 18,
    fontWeight: "600",
  },

  removeBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.destructive,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  removeBtnText: {
    color: colors.destructive,
    fontSize: 18,
    fontWeight: "600",
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },

  confirmCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 24,
    maxWidth: 320,
    width: "100%",
    alignItems: "center",
  },

  confirmTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },

  confirmDesc: {
    color: colors.textMuted,
    fontSize: 15,
    marginBottom: 20,
    textAlign: "center",
  },

  confirmBtns: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },

  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },

  cancelText: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: "600",
  },

  deleteBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.destructive,
    alignItems: "center",
  },

  deleteText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
});