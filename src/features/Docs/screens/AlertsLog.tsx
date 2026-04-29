import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AlertTriangle, Trash2 } from "lucide-react-native";
import { BackButton } from "../../../components/BackButton";
import { colors } from "../../../theme";
import { useAlerts } from "../hooks/useAlerts";

const formatWhen = (iso: string) => {
  try {
    const d = new Date(iso);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  } catch {
    return "";
  }
};

export function AlertsLog() {
  const insets = useSafeAreaInsets();
  const { alerts, clearAlerts } = useAlerts();
  const [confirming, setConfirming] = useState(false);

  const handleClear = () => {
    clearAlerts();
    setConfirming(false);
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 12 }]}>
      <BackButton
        label="Alerts"
        to="Docs"
        right={
          alerts.length > 0 ? (
            <TouchableOpacity onPress={() => setConfirming(true)} style={styles.clearBtn}>
              <Trash2 size={20} color={colors.destructive} />
            </TouchableOpacity>
          ) : null
        }
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <AlertTriangle size={22} color={colors.destructive} />
          <Text style={styles.headerTitle}>Flagged Messages</Text>
        </View>
        <Text style={styles.headerSub}>
          Every chat message that matched one of the red-flag keywords gets logged here so you can review them later.
        </Text>

        {alerts.length === 0 && (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>Nothing flagged yet</Text>
            <Text style={styles.emptyHint}>
              When you send a message that mentions things like "chest pain", "emergency", "bleeding" or similar urgent terms, the message will appear here.
            </Text>
          </View>
        )}

        {alerts.map((a) => (
          <View key={a.id} style={styles.alertCard}>
            <Text style={styles.alertWhen}>{formatWhen(a.timestamp)}</Text>
            <Text style={styles.alertMessage}>{a.message}</Text>
            <View style={styles.keywordRow}>
              {a.keywords.map((k, i) => (
                <View key={i} style={styles.keywordPill}>
                  <Text style={styles.keywordText}>{k}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.alertChat}>{a.storageKey}</Text>
          </View>
        ))}
      </ScrollView>

      <Modal visible={confirming} transparent animationType="fade" onRequestClose={() => setConfirming(false)}>
        <View style={styles.overlay}>
          <View style={styles.confirmCard}>
            <Trash2 size={32} color={colors.destructive} style={{ marginBottom: 10 }} />
            <Text style={styles.confirmTitle}>Clear all alert logs?</Text>
            <Text style={styles.confirmDesc}>This cannot be undone.</Text>
            <View style={styles.confirmRow}>
              <TouchableOpacity onPress={() => setConfirming(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleClear} style={styles.deleteBtn}>
                <Text style={styles.deleteBtnText}>Clear</Text>
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
  content: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 24, gap: 14 },
  clearBtn: { paddingHorizontal: 10, paddingVertical: 8 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "700",
  },
  headerSub: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 4,
  },

  emptyWrap: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "700",
  },
  emptyHint: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },

  alertCard: {
    backgroundColor: colors.card,
    borderLeftWidth: 4,
    borderLeftColor: colors.destructive,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  alertWhen: { color: colors.textCaption, fontSize: 13 },
  alertMessage: { color: colors.text, fontSize: 16, lineHeight: 22 },
  keywordRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 2,
  },
  keywordPill: {
    backgroundColor: colors.destructive,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  keywordText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  alertChat: { color: colors.textCaption, fontSize: 12, marginTop: 2 },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  confirmCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
  },
  confirmTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "700",
    marginBottom: 6,
  },
  confirmDesc: {
    color: colors.textMuted,
    fontSize: 15,
    textAlign: "center",
    marginBottom: 18,
  },
  confirmRow: {
    flexDirection: "row",
    gap: 10,
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
  deleteBtnText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
});
