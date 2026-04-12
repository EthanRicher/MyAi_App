import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Mic, FileText, Pill, Calendar, Globe, ChevronRight } from "lucide-react-native";
import { BackButton } from "../../../components/BackButton";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors } from "../../../theme";
import { ScopeId } from "../../../ai/scopes";

type Nav = NativeStackNavigationProp<RootStackParamList, "Clarity">;

const cards: {
  title: string;
  desc: string;
  icon: any;
  path: "ClarityRecord" | null;
  scopeId?: ScopeId;
}[] = [
  {
    title: "Doctor Explained",
    desc: "Record medical conversations",
    icon: Mic,
    path: "ClarityRecord",
  },
  {
    title: "Summarise Document",
    desc: "Simplify medical documents",
    icon: FileText,
    path: null,
    scopeId: "claritySummariseDocument",
  },
  {
    title: "Explain Medication",
    desc: "Understand prescriptions",
    icon: Pill,
    path: null,
    scopeId: "clarityExplainMedication",
  },
  {
    title: "Appointment Prep",
    desc: "Get ready for your visit",
    icon: Calendar,
    path: null,
    scopeId: "clarityAppointmentPrep",
  },
  {
    title: "Explain Everyday",
    desc: "Tech, news & bills made simple",
    icon: Globe,
    path: null,
    scopeId: "clarityExplainEveryday",
  },
];

export function ClarityLanding() {
  const navigation = useNavigation<Nav>();

  return (
    <View style={styles.container}>
      <BackButton label="Home" to="Home" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Clarity Layer</Text>
        <Text style={styles.sub}>Understand medical information clearly</Text>

        <View style={styles.list}>
          {cards.map((c, i) => (
            <TouchableOpacity
              key={c.title}
              onPress={() => {
                if (c.path) {
                  navigation.navigate(c.path);
                } else if (c.scopeId) {
                  navigation.navigate("ClarityChat", { scopeId: c.scopeId } as any);
                }
              }}
              style={[styles.card, { borderLeftColor: i === 0 ? "#E53935" : colors.primary }]}
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

        <TouchableOpacity
          onPress={() =>
            navigation.navigate("ClarityChat", {
              scopeId: "clarityGeneralChat",
            } as any)
          }
          style={styles.ctaBtn}
          accessibilityLabel="Start a conversation"
        >
          <Text style={styles.ctaText}>Start a Conversation</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          AI helps you understand. Always confirm with your doctor.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  heading: { color: colors.text, fontSize: 24, fontWeight: "700", marginBottom: 4 },
  sub: { color: colors.textMuted, fontSize: 16, marginBottom: 12 },
  list: { gap: 10 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderLeftWidth: 4,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "rgba(13,217,247,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardText: { flex: 1 },
  cardTitle: { color: colors.text, fontSize: 21, fontWeight: "700" },
  cardDesc: { color: colors.textMuted, fontSize: 16 },
  ctaBtn: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    marginTop: 12,
  },
  ctaText: { color: colors.background, fontSize: 18, fontWeight: "700" },
  disclaimer: {
    color: colors.textCaption,
    textAlign: "center",
    fontSize: 13,
    marginTop: 8,
    lineHeight: 20,
  },
});