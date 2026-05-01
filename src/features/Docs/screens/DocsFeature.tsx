import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ChevronRight, Mail, CalendarDays, Users, Heart, BookOpen, Stethoscope, ClipboardList } from "lucide-react-native";
import { BackButton } from "../../../components/BackButton";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors } from "../../../theme";
import { useDocs } from "../hooks/useDocs";
import { CATEGORY_LABELS, Doc, DocCategory } from "../models/Doc";
import { getFeatureGroup } from "../models/FeatureGroup";

type Nav = NativeStackNavigationProp<RootStackParamList, "DocsFeature">;
type Rt = RouteProp<RootStackParamList, "DocsFeature">;

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

export function DocsFeature() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const { featureId } = route.params;
  const group = getFeatureGroup(featureId);
  const { docs } = useDocs();

  if (!group) {
    return (
      <View style={styles.container}>
        <BackButton label="Docs" to="Docs" />
      </View>
    );
  }

  const grouped: Record<DocCategory, Doc[]> = {
    letter: [], plan: [], family: [], memory: [], summary: [], doctor: [], appointment: [],
  };
  for (const d of docs) grouped[d.category]?.push(d);

  const FeatureIcon = group.icon;

  return (
    <View style={styles.container}>
      <BackButton label={group.label} to="Docs" />

      <View style={[styles.header, { borderBottomColor: group.color + "55" }]}>
        <View style={[styles.headerIcon, { backgroundColor: group.color + "20" }]}>
          <FeatureIcon size={26} color={group.color} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: group.color }]}>{group.label}</Text>
          <Text style={styles.headerSub}>
            {group.categories.length === 0
              ? "Nothing to save here yet"
              : `${group.categories.length} ${group.categories.length === 1 ? "type" : "types"} of doc`}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {group.categories.length === 0 ? (
          <View style={styles.emptyBox}>
            <FeatureIcon size={40} color={colors.textCaption} />
            <Text style={styles.emptyTitle}>Nothing saves here yet</Text>
            <Text style={styles.emptyHint}>
              {group.label} doesn't save documents at the moment. Anything that does will appear here.
            </Text>
          </View>
        ) : (
          group.categories.map((cat) => {
            const items = grouped[cat] || [];
            const Icon = CATEGORY_ICONS[cat];
            const liveColor = CATEGORY_COLORS[cat];
            const isEmpty = items.length === 0;
            const tone = isEmpty ? colors.textCaption : liveColor;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => navigation.navigate("DocsCategory", { category: cat })}
                style={[
                  styles.catBtn,
                  isEmpty ? styles.catBtnEmpty : { borderColor: liveColor + "55" },
                ]}
                activeOpacity={0.7}
                accessibilityLabel={`Open ${CATEGORY_LABELS[cat]}`}
              >
                <View
                  style={[
                    styles.catBtnIcon,
                    { backgroundColor: isEmpty ? "rgba(255,255,255,0.04)" : liveColor + "20" },
                  ]}
                >
                  <Icon size={22} color={tone} />
                </View>
                <View style={styles.catBtnMeta}>
                  <Text
                    style={[
                      styles.catBtnTitle,
                      { color: isEmpty ? colors.textMuted : colors.text },
                    ]}
                  >
                    {CATEGORY_LABELS[cat]}
                  </Text>
                  <Text style={styles.catBtnCount}>
                    {isEmpty ? "Empty" : `${items.length} saved`}
                  </Text>
                </View>
                <ChevronRight size={22} color={isEmpty ? colors.border : colors.textMuted} />
              </TouchableOpacity>
            );
          })
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
  headerSub: { color: colors.textMuted, fontSize: 14, marginTop: 2 },

  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24, gap: 10 },

  catBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: colors.card,
    borderColor: "transparent",
  },
  catBtnEmpty: {
    backgroundColor: "transparent",
    borderColor: colors.border,
    borderStyle: "dashed",
  },
  catBtnIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  catBtnMeta: { flex: 1 },
  catBtnTitle: { fontSize: 17, fontWeight: "700" },
  catBtnCount: { color: colors.textCaption, fontSize: 13, marginTop: 2 },

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
});
