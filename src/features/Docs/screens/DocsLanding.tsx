import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronRight, AlertTriangle } from "lucide-react-native";
import { BackButton } from "../../../components/BackButton";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors } from "../../../theme";
import { useDocs } from "../hooks/useDocs";
import { useAlerts } from "../hooks/useAlerts";
import { FEATURE_GROUPS } from "../models/FeatureGroup";

type Nav = NativeStackNavigationProp<RootStackParamList, "Docs">;

export function DocsLanding() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { docs } = useDocs();
  const { alerts } = useAlerts();

  return (
    <View style={styles.container}>
      <BackButton label="Docs" to="Home" />

      <ScrollView contentContainerStyle={styles.content}>
        {FEATURE_GROUPS.map((group) => {
          const Icon = group.icon;
          const count = docs.filter((d) => group.categories.includes(d.category)).length;
          const hasContent = group.categories.length > 0 && count > 0;
          const tone = hasContent ? group.color : colors.textCaption;
          const summary =
            group.categories.length === 0
              ? "Nothing to save here yet"
              : count === 0
                ? "Empty"
                : `${count} saved`;
          return (
            <TouchableOpacity
              key={group.id}
              onPress={() => navigation.navigate("DocsFeature", { featureId: group.id })}
              style={[
                styles.featureBtn,
                hasContent
                  ? { borderColor: group.color + "55", backgroundColor: colors.card }
                  : styles.featureBtnEmpty,
              ]}
              activeOpacity={0.7}
              accessibilityLabel={`Open ${group.label}`}
            >
              <View
                style={[
                  styles.featureIcon,
                  {
                    backgroundColor: hasContent ? group.color + "20" : "rgba(255,255,255,0.04)",
                  },
                ]}
              >
                <Icon size={26} color={tone} />
              </View>
              <View style={styles.featureMeta}>
                <Text
                  style={[
                    styles.featureTitle,
                    { color: hasContent ? colors.text : colors.textMuted },
                  ]}
                >
                  {group.label}
                </Text>
                <Text style={styles.featureSummary}>{summary}</Text>
              </View>
              <ChevronRight size={22} color={hasContent ? colors.textMuted : colors.border} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          onPress={() => navigation.navigate("AlertsLog")}
          style={styles.alertsBtn}
          accessibilityLabel="View flagged messages log"
        >
          <AlertTriangle size={20} color={colors.destructive} />
          <Text style={styles.alertsBtnText}>View Flagged Messages</Text>
          <View style={styles.alertsCountPill}>
            <Text style={styles.alertsCountText}>{alerts.length}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, gap: 10 },

  featureBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  featureBtnEmpty: {
    backgroundColor: "transparent",
    borderColor: colors.border,
    borderStyle: "dashed",
  },
  featureIcon: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  featureMeta: { flex: 1 },
  featureTitle: { fontSize: 19, fontWeight: "800" },
  featureSummary: { color: colors.textCaption, fontSize: 14, marginTop: 3 },

  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  alertsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.destructive + "88",
    backgroundColor: colors.destructive + "12",
  },
  alertsBtnText: {
    color: colors.destructive,
    fontSize: 16,
    fontWeight: "700",
  },
  alertsCountPill: {
    minWidth: 26,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: colors.destructive,
    alignItems: "center",
    justifyContent: "center",
  },
  alertsCountText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
  },
});
