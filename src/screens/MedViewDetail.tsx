import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Pill, Sun, Moon, Edit, Trash2 } from "lucide-react-native";
import { BackButton } from "../components/BackButton";
import { RootStackParamList } from "../navigation/AppNavigator";
import { colors } from "../theme";

type Nav = NativeStackNavigationProp<RootStackParamList, "MedViewDetail">;
type Route = RouteProp<RootStackParamList, "MedViewDetail">;

const medsData: Record<string, { name: string; type: string; dose: string; schedule: string; description: string; morning: boolean; evening: boolean }> = {
  "1": { name: "Metformin", type: "Tablet", dose: "500mg", schedule: "Once daily — Morning", description: "Metformin helps control blood sugar levels. It works by improving the way your body handles insulin. It's commonly used for Type 2 diabetes.", morning: true, evening: false },
  "2": { name: "Amlodipine", type: "Tablet", dose: "5mg", schedule: "Once daily — Morning", description: "Amlodipine helps lower blood pressure by relaxing blood vessels, making it easier for your heart to pump blood.", morning: true, evening: false },
  "3": { name: "Aspirin", type: "Tablet", dose: "100mg", schedule: "Once daily — Afternoon", description: "Low-dose aspirin helps prevent blood clots. It's often used to reduce the risk of heart attack and stroke.", morning: false, evening: false },
  "4": { name: "Atorvastatin", type: "Tablet", dose: "20mg", schedule: "Once daily — Evening", description: "Atorvastatin helps lower cholesterol levels. Taking it in the evening is most effective as your body produces more cholesterol at night.", morning: false, evening: true },
  "5": { name: "Vitamin D", type: "Supplement", dose: "1000IU", schedule: "Once daily — Evening", description: "Vitamin D helps your body absorb calcium for strong bones. It's especially important as we get older.", morning: false, evening: true },
};

export function MedViewDetail() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { id } = route.params;
  const [showConfirm, setShowConfirm] = useState(false);
  const med = medsData[id] || medsData["1"];

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
              <Text style={styles.medSub}>{med.type} · {med.dose}</Text>
            </View>
          </View>
          <Text style={styles.schedule}>{med.schedule}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardHeading}>What Does It Do?</Text>
          <Text style={styles.cardBody}>{med.description}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardHeading}>Schedule</Text>
          <View style={styles.scheduleRow}>
            <View style={[styles.timeChip, med.morning && styles.timeChipActive]}>
              <Sun size={20} color={med.morning ? colors.orange : colors.border} />
              <Text style={[styles.timeLabel, { color: med.morning ? colors.text : colors.border }]}>Morning</Text>
            </View>
            <View style={[styles.timeChip, med.evening && styles.timeChipActive]}>
              <Moon size={20} color={med.evening ? colors.purple : colors.border} />
              <Text style={[styles.timeLabel, { color: med.evening ? colors.text : colors.border }]}>Evening</Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.editBtn}>
            <Edit size={20} color={colors.green} />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowConfirm(true)} style={styles.removeBtn}>
            <Trash2 size={20} color={colors.destructive} />
            <Text style={styles.removeBtnText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={showConfirm} transparent animationType="fade" onRequestClose={() => setShowConfirm(false)}>
        <View style={styles.overlay}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Remove {med.name}?</Text>
            <Text style={styles.confirmDesc}>This will remove this medication from your list.</Text>
            <View style={styles.confirmBtns}>
              <TouchableOpacity onPress={() => setShowConfirm(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setShowConfirm(false); navigation.navigate("MedView"); }} style={styles.deleteBtn}>
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
  headerCard: { backgroundColor: colors.card, borderRadius: 16, padding: 20, borderTopWidth: 4, borderTopColor: colors.green },
  headerTop: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 12 },
  pillIcon: { width: 56, height: 56, borderRadius: 12, backgroundColor: colors.green + "33", alignItems: "center", justifyContent: "center" },
  medName: { color: colors.text, fontSize: 24, fontWeight: "700" },
  medSub: { color: colors.textMuted, fontSize: 17 },
  schedule: { color: colors.textMuted, fontSize: 17 },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 20 },
  cardHeading: { color: colors.text, fontSize: 20, fontWeight: "700", marginBottom: 8 },
  cardBody: { color: colors.textMuted, fontSize: 17, lineHeight: 27 },
  scheduleRow: { flexDirection: "row", gap: 16 },
  timeChip: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: colors.background },
  timeChipActive: { backgroundColor: colors.green + "33" },
  timeLabel: { fontSize: 17, fontWeight: "600" },
  actions: { flexDirection: "row", gap: 12 },
  editBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.green, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  editBtnText: { color: colors.green, fontSize: 18, fontWeight: "600" },
  removeBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.destructive, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  removeBtnText: { color: colors.destructive, fontSize: 18, fontWeight: "600" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", alignItems: "center", justifyContent: "center" },
  confirmCard: { backgroundColor: colors.card, borderRadius: 16, padding: 24, marginHorizontal: 24, maxWidth: 320, width: "100%", alignItems: "center" },
  confirmTitle: { color: colors.text, fontSize: 20, fontWeight: "700", marginBottom: 12, textAlign: "center" },
  confirmDesc: { color: colors.textMuted, fontSize: 15, marginBottom: 20, textAlign: "center" },
  confirmBtns: { flexDirection: "row", gap: 12, width: "100%" },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: "center" },
  cancelText: { color: colors.textMuted, fontSize: 16, fontWeight: "600" },
  deleteBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.destructive, alignItems: "center" },
  deleteText: { color: colors.text, fontSize: 16, fontWeight: "600" },
});
