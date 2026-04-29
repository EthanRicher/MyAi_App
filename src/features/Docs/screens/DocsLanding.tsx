import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronRight, FileText, Mail, CalendarDays, Users, Heart, BookOpen, AlertTriangle } from "lucide-react-native";
import { BackButton } from "../../../components/BackButton";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors } from "../../../theme";
import { useDocs } from "../hooks/useDocs";
import { useAlerts } from "../hooks/useAlerts";
import { CATEGORY_LABELS, CATEGORY_ORDER, Doc, DocCategory } from "../models/Doc";

type Nav = NativeStackNavigationProp<RootStackParamList, "Docs">;

const CATEGORY_ICONS: Record<DocCategory, any> = {
  letter: Mail,
  plan: CalendarDays,
  family: Users,
  memory: Heart,
  summary: BookOpen,
  general: FileText,
};

const CATEGORY_COLORS: Record<DocCategory, string> = {
  letter: "#0dd9f7",
  plan: "#FF9800",
  family: "#BB86FC",
  memory: "#F472B6",
  summary: "#4CAF50",
  general: colors.textMuted,
};

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return "";
  }
};

export function DocsLanding() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { docs } = useDocs();
  const { alerts } = useAlerts();

  const grouped: Record<DocCategory, Doc[]> = {
    letter: [], plan: [], family: [], memory: [], summary: [], general: [],
  };
  for (const d of docs) grouped[d.category]?.push(d);

  const hasAny = docs.length > 0;

  return (
    <View style={styles.container}>
      <BackButton label="Docs" to="Home" />

      <ScrollView contentContainerStyle={styles.content}>
        {!hasAny && (
          <View style={styles.emptyWrap}>
            <FileText size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No saved documents yet</Text>
            <Text style={styles.emptyHint}>
              When you finish a letter, plan, or memory in chat, tap "Save to Docs" on the AI's reply and it will appear here.
            </Text>
          </View>
        )}

        {CATEGORY_ORDER.map((cat) => {
          const items = grouped[cat];
          if (!items || items.length === 0) return null;
          const Icon = CATEGORY_ICONS[cat];
          const color = CATEGORY_COLORS[cat];
          return (
            <View key={cat} style={styles.categoryBlock}>
              <View style={styles.categoryHeader}>
                <Icon size={18} color={color} />
                <Text style={[styles.categoryTitle, { color }]}>{CATEGORY_LABELS[cat]}</Text>
                <Text style={styles.categoryCount}>{items.length}</Text>
              </View>
              {items.map((d) => (
                <TouchableOpacity
                  key={d.id}
                  onPress={() => navigation.navigate("DocsDetail", { id: d.id })}
                  style={[styles.docCard, { borderColor: color + "55" }]}
                  accessibilityLabel={`Open ${d.title}`}
                >
                  <View style={[styles.docIcon, { backgroundColor: color + "20" }]}>
                    <Icon size={22} color={color} />
                  </View>
                  <View style={styles.docMeta}>
                    <Text style={styles.docTitle} numberOfLines={1}>{d.title}</Text>
                    <Text style={styles.docDate}>{formatDate(d.updatedAt)}</Text>
                  </View>
                  <ChevronRight size={22} color={colors.border} />
                </TouchableOpacity>
              ))}
            </View>
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
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, gap: 18 },
  emptyWrap: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  emptyHint: {
    color: colors.textMuted,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  categoryBlock: {
    gap: 8,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
    marginBottom: 2,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  categoryCount: {
    color: colors.textCaption,
    fontSize: 13,
  },
  docCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
  },
  docIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  docMeta: {
    flex: 1,
  },
  docTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "600",
  },
  docDate: {
    color: colors.textCaption,
    fontSize: 13,
    marginTop: 2,
  },
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
