import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Modal } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Lock, X } from "lucide-react-native";
import { RootStackParamList } from "../navigation/AppNavigator";
import { colors } from "../theme";

type Nav = NativeStackNavigationProp<RootStackParamList, "Lockout">;

export function LockoutScreen() {
  const navigation = useNavigation<Nav>();
  const [seconds, setSeconds] = useState(300);
  const [showEmergency, setShowEmergency] = useState(false);
  const [emergencyEmail, setEmergencyEmail] = useState("");

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [seconds]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <View style={styles.container}>
      <View style={styles.lockCircle}>
        <Lock size={44} color={colors.destructive} />
      </View>
      <Text style={styles.title}>Account Locked</Text>
      <Text style={styles.desc}>Too many failed attempts. Please wait before trying again.</Text>
      <Text style={styles.timer}>
        {mins}:{secs.toString().padStart(2, "0")}
      </Text>
      <TouchableOpacity
        onPress={() => seconds <= 0 && navigation.replace("Login")}
        disabled={seconds > 0}
        style={[styles.tryBtn, { borderColor: seconds > 0 ? colors.border : colors.primary }]}
        accessibilityLabel="Try again"
      >
        <Text style={[styles.tryText, { color: seconds > 0 ? colors.border : colors.primary }]}>
          Try Again
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setShowEmergency(true)}
        style={styles.emergencyBtn}
        accessibilityLabel="Emergency family access"
      >
        <Text style={styles.emergencyText}>Emergency Family Access</Text>
      </TouchableOpacity>

      <Modal visible={showEmergency} transparent animationType="fade" onRequestClose={() => setShowEmergency(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Emergency Access</Text>
              <TouchableOpacity onPress={() => setShowEmergency(false)} accessibilityLabel="Close">
                <X size={24} color={colors.textCaption} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDesc}>
              Enter a trusted family member's email. Access will be logged and visible to the account holder.
            </Text>
            <TextInput
              keyboardType="email-address"
              value={emergencyEmail}
              onChangeText={setEmergencyEmail}
              placeholder="Family member's email"
              placeholderTextColor={colors.textCaption}
              style={styles.emailInput}
              accessibilityLabel="Email address"
            />
            <TouchableOpacity
              onPress={() => setShowEmergency(false)}
              style={styles.requestBtn}
            >
              <Text style={styles.requestText}>Request Access</Text>
            </TouchableOpacity>
            <Text style={styles.logNote}>This access attempt will be logged.</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 24,
  },
  lockCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: colors.destructive,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
  },
  desc: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 26,
    textAlign: "center",
  },
  timer: {
    color: colors.primary,
    fontSize: 40,
    fontWeight: "700",
  },
  tryBtn: {
    width: "100%",
    maxWidth: 300,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
  },
  tryText: {
    fontSize: 18,
    fontWeight: "700",
  },
  emergencyBtn: {
    width: "100%",
    maxWidth: 300,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.destructive,
    alignItems: "center",
  },
  emergencyText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 24,
    maxWidth: 340,
    width: "100%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
  },
  modalDesc: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 16,
  },
  emailInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 16,
    marginBottom: 16,
  },
  requestBtn: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.destructive,
    alignItems: "center",
  },
  requestText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  logNote: {
    color: colors.textCaption,
    fontSize: 12,
    textAlign: "center",
    marginTop: 12,
  },
});
