import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Mic, FileText, Pill, Calendar, Globe, ChevronRight } from "lucide-react-native";
import { BackButton } from "../../../components/BackButton";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors } from "../../../theme";

type Nav = NativeStackNavigationProp<RootStackParamList, "Clarity">;

const cards = [
  { title: "Doctor Explained", desc: "Record medical conversations", icon: Mic, path: "ClarityRecord" as const, chat: "", chips: [] },
  { title: "Summarise Document", desc: "Simplify medical documents", icon: FileText, path: null, chat: "I can help you understand medical documents. You can describe the document or type out the key parts, and I'll explain them in simple terms.", chips: ["Summarise this letter", "What does this result mean?", "Explain in simpler words"] },
  { title: "Explain Medication", desc: "Understand prescriptions", icon: Pill, path: null, chat: "I'd be happy to help you understand your medication. What medication would you like to know about?", chips: ["What are the side effects?", "Can I take it with food?", "What if I miss a dose?"] },
  { title: "Appointment Prep", desc: "Get ready for your visit", icon: Calendar, path: null, chat: "Let's prepare some questions for your next appointment. What type of appointment do you have coming up?", chips: ["GP visit next week", "Specialist follow-up", "What should I ask about my results?"] },
  { title: "Explain Everyday", desc: "Tech, news & bills made simple", icon: Globe, path: null, chat: "I can help explain technology, news, or bills in simple language. What would you like to understand better?", chips: ["Explain this bill", "What does this tech term mean?", "Summarise this news article"] },
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
                } else {
                  navigation.navigate("ClarityChat", { title: c.title, initialMessage: c.chat, chips: c.chips });
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
          onPress={() => navigation.navigate("ClarityChat", {
            title: "Clarity Chat",
            initialMessage: "Hello! I'm your Clarity assistant. I can help you understand medical information, documents, and more. What would you like help with today?",
            chips: ["Explain something medical", "Help me understand a letter", "Prepare for my appointment"],
          })}
          style={styles.ctaBtn}
          accessibilityLabel="Start a conversation"
        >
          <Text style={styles.ctaText}>Start a Conversation</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>AI helps you understand. Always confirm with your doctor.</Text>
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
  disclaimer: { color: colors.textCaption, textAlign: "center", fontSize: 13, marginTop: 8, lineHeight: 20 },
});
