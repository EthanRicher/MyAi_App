import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { Volume2, Copy, Save, RefreshCw } from "lucide-react-native";
import { BackButton } from "../components/BackButton";
import { colors } from "../theme";

const followUps = [
  "What are the side effects of this medication?",
  "How often should I take this?",
  "Should I change my diet?",
  "When is my next appointment?",
];

export function ClarityResult() {
  return (
    <View style={styles.container}>
      <BackButton label="Clarity" to="Clarity" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Plain Language Summary</Text>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>
            Your doctor said that your blood pressure is a little higher than normal. They want you to take a new medication called Amlodipine once a day in the morning. You should also try to reduce salt in your food and walk for 30 minutes each day. They'd like to see you again in 6 weeks to check how you're going.
          </Text>
        </View>

        <View style={styles.actionsRow}>
          {[
            { icon: Volume2, label: "Listen" },
            { icon: Copy, label: "Copy", action: () => Alert.alert("Copied to clipboard") },
            { icon: Save, label: "Save", action: () => Alert.alert("Saved successfully") },
            { icon: RefreshCw, label: "New" },
          ].map((b) => (
            <TouchableOpacity
              key={b.label}
              onPress={b.action}
              style={styles.actionBtn}
              accessibilityLabel={b.label}
            >
              <b.icon size={26} color={colors.primary} />
              <Text style={styles.actionLabel}>{b.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.followUpHeading}>Follow-up Questions</Text>
        <View style={styles.followUpList}>
          {followUps.map((q) => (
            <View key={q} style={styles.followUpItem}>
              <Text style={styles.followUpText}>{q}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },
  heading: { color: colors.text, fontSize: 26, fontWeight: "700", marginBottom: 16 },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  summaryText: { color: colors.text, fontSize: 18, lineHeight: 29 },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  actionLabel: { color: colors.textMuted, fontSize: 15 },
  followUpHeading: { color: colors.text, fontSize: 20, fontWeight: "700", marginBottom: 12 },
  followUpList: { gap: 10 },
  followUpItem: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  followUpText: { color: colors.text, fontSize: 17 },
});
