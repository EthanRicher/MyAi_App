import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ChevronRight, Mail, CalendarDays, Users, Heart, BookOpen, Stethoscope, ClipboardList } from "lucide-react-native";
import { BackButton } from "../../../components/BackButton";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors } from "../../../theme";
import { useDocs } from "../hooks/useDocs";
import { CATEGORY_LABELS, DocCategory } from "../models/Doc";

/**
 * Category-level Docs screen. Shows all saved docs in a single
 * category with their title and last-updated date. Tapping a row
 * opens DocsDetail for that doc.
 */

type Nav = NativeStackNavigationProp<RootStackParamList, "DocsCategory">;
type Rt = RouteProp<RootStackParamList, "DocsCategory">;

const CATEGORY_ICONS: Record<DocCategory, any> = {
  letter: Mail,
  plan: CalendarDays,
  family: Users,
  memory: Heart,
  summary: BookOpen,
  doctor: Stethoscope,
  appointment: ClipboardList,
};

const CATEGORY_COLORS: Record<DocCategory, string> = {
  letter: "#0dd9f7",
  plan: "#FF9800",
  family: "#BB86FC",
  memory: "#F472B6",
  summary: "#4CAF50",
  doctor: "#0dd9f7",
  appointment: "#0dd9f7",
};

// Locale-aware date string. Wrapped in try/catch because RN dates can be flaky on bad input.
const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return "";
  }
};

export function DocsCategory() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const { category } = route.params;
  const { docs } = useDocs();

  const Icon = CATEGORY_ICONS[category];
  const color = CATEGORY_COLORS[category];
  const items = docs.filter((d) => d.category === category);

  return (
    <View style={styles.container}>
      <BackButton label={CATEGORY_LABELS[category]} to="Docs" />

      <View style={[styles.header, { borderBottomColor: color + "55" }]}>
        <View style={[styles.headerIcon, { backgroundColor: color + "20" }]}>
          <Icon size={26} color={color} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color }]}>{CATEGORY_LABELS[category]}</Text>
          <Text style={styles.headerCount}>
            {items.length === 0 ? "No items yet" : `${items.length} saved`}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {items.length === 0 ? (
          <View style={styles.emptyBox}>
            <Icon size={40} color={colors.textCaption} />
            <Text style={styles.emptyTitle}>
              No {CATEGORY_LABELS[category].toLowerCase()} saved yet
            </Text>
            <Text style={styles.emptyHint}>
              Items will appear here once you save them from a chat.
            </Text>
          </View>
        ) : (
          items.map((d) => (
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
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
  },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: "800" },
  headerCount: { color: colors.textMuted, fontSize: 14, marginTop: 2 },

  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24, gap: 8 },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 60,
    paddingHorizontal: 24,
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.border,
  },
  emptyTitle: { color: colors.text, fontSize: 17, fontWeight: "700", textAlign: "center" },
  emptyHint: { color: colors.textMuted, fontSize: 14, textAlign: "center", lineHeight: 20 },

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
  docMeta: { flex: 1 },
  docTitle: { color: colors.text, fontSize: 17, fontWeight: "600" },
  docDate: { color: colors.textCaption, fontSize: 13, marginTop: 2 },
});
