import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Wrench } from "lucide-react-native";
import { colors } from "../theme";

interface Props {
  open: boolean;
  onClose: () => void;
  description: string;
}

export function BackendRequiredModal({ open, onClose, description }: Props) {
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Wrench size={36} color={colors.textMuted} />
          </View>
          <Text style={styles.title}>Backend Required</Text>
          <Text style={styles.desc}>{description}</Text>
          <TouchableOpacity style={styles.button} onPress={onClose} accessibilityLabel="Dismiss backend required notice">
            <Text style={styles.buttonText}>Got It</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 32,
    marginHorizontal: 24,
    maxWidth: 340,
    width: "100%",
    alignItems: "center",
    gap: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  desc: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  button: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
  },
  buttonText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: "700",
  },
});
