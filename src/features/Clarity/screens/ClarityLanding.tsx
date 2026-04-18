import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Mic, FileText, Pill, Calendar, Globe, ChevronRight } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackButton } from "../../../components/BackButton";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors } from "../../../theme";
import { ScopeId } from "../../../ai/scopes";

type Nav = NativeStackNavigationProp<RootStackParamList, "Clarity">;

const cards: {
  title: string;
  desc: string;
  icon: any;
  scopeId: ScopeId;
}[] = [
  {
    title: "Doctor Explained",
    desc: "Record medical conversations",
    icon: Mic,
    scopeId: "clarityDoctorExplained",
  },
  {
    title: "Summarise Document",
    desc: "Simplify medical documents",
    icon: FileText,
    scopeId: "claritySummariseDocument",
  },
  {
    title: "Explain Medication",
    desc: "Understand prescriptions",
    icon: Pill,
    scopeId: "clarityExplainMedication",
  },
  {
    title: "Appointment Prep",
    desc: "Get ready for your visit",
    icon: Calendar,
    scopeId: "clarityAppointmentPrep",
  },
  {
    title: "Explain Everyday",
    desc: "Tech, news & bills made simple",
    icon: Globe,
    scopeId: "clarityExplainEveryday",
  },
];

export function ClarityLanding() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 12 }]}>
      <BackButton label="Clarity Layer" to="Home" />

      <View style={styles.list}>
        {cards.map((c) => (
          <TouchableOpacity
            key={c.title}
            onPress={() => navigation.navigate("ClarityChat", { scopeId: c.scopeId } as any)}
            style={styles.card}
            accessibilityLabel={c.title}
          >
            <View style={styles.iconWrap}>
              <c.icon size={30} color={colors.primary} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{c.title}</Text>
              <Text style={styles.cardDesc}>{c.desc}</Text>
            </View>
            <ChevronRight size={26} color={colors.border} />
          </TouchableOpacity>
        ))}

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 10,
  },
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: "rgba(13,217,247,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardText: { flex: 1 },
  cardTitle: { color: colors.text, fontSize: 20, fontWeight: "600" },
  cardDesc: { color: colors.textMuted, fontSize: 16 },
});
