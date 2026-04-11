import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MessageCircle, Brain, Calendar, Heart, HelpCircle, BookOpen, Users, Mail, Bookmark, Palette, ChevronRight } from "lucide-react-native";
import { BackButton } from "../components/BackButton";
import { RootStackParamList } from "../navigation/AppNavigator";
import { colors } from "../theme";

type Nav = NativeStackNavigationProp<RootStackParamList, "Companion">;

const conversationCards = [
  { title: "Chat", desc: "Friendly conversation", icon: MessageCircle, msg: "Hello! I'm so glad you're here. It's always nice to have someone to talk to. What's on your mind today?" },
  { title: "Brain Games", desc: "Trivia & teasers", icon: Brain, msg: "Let's give your mind a little workout! Would you like a fun fact, a gentle brain teaser, or to learn something new today?" },
  { title: "Plan My Day", desc: "Organise your day", icon: Calendar, msg: "Let's plan your day together! What do you have coming up today, or would you like me to suggest a balanced routine?" },
  { title: "Calm Down", desc: "Relaxation & breathing", icon: Heart, msg: "I'm here to help you feel calm and centred. Would you like to try a breathing exercise, or would you prefer to just talk about how you're feeling?" },
  { title: "Ask Anything", desc: "Tech, cooking, emails", icon: HelpCircle, msg: "I'm happy to help with anything! What would you like to know about? It could be technology, cooking, emails, or anything at all." },
];

const storiesCards = [
  { title: "Share Stories", desc: "Tell your stories", icon: BookOpen, msg: "I'd love to hear about your life! What's a favourite memory you'd like to share?" },
  { title: "Family Tree", desc: "Map your family", icon: Users, msg: "Let's build your family tree! Who would you like to start with? Tell me about your family members." },
  { title: "Write Letters", desc: "Express your feelings", icon: Mail, msg: "Writing letters to family is a wonderful way to share your feelings. Who would you like to write to today?" },
  { title: "Memory Book", desc: "Compile memories", icon: Bookmark, msg: "Let's turn your precious memories into a beautiful book. What's the first memory that comes to mind?" },
  { title: "Creative Corner", desc: "Poetry & art", icon: Palette, msg: "Let's get creative! Would you like to try writing a poem, describing a painting, or perhaps composing a short story?" },
];

export function Companion() {
  const navigation = useNavigation<Nav>();
  const [tab, setTab] = useState<"conversation" | "stories">("conversation");
  const cards = tab === "conversation" ? conversationCards : storiesCards;

  return (
    <View style={styles.container}>
      <BackButton label="Home" to="Home" />
      <Text style={styles.heading}>Companion</Text>

      <View style={styles.tabs}>
        {(["conversation", "stories"] as const).map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tab, tab === t && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.list}>
          {cards.map((c) => (
            <TouchableOpacity
              key={c.title}
              onPress={() => navigation.navigate("CompanionChat", { title: c.title, initialMessage: c.msg })}
              style={styles.card}
              accessibilityLabel={c.title}
            >
              <View style={styles.iconWrap}>
                <c.icon size={28} color="#BB86FC" />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{c.title}</Text>
                <Text style={styles.cardDesc}>{c.desc}</Text>
              </View>
              <ChevronRight size={24} color={colors.border} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate("CompanionChat", { title: "Companion Chat", initialMessage: "Hello! I'm your companion. I'm here to chat, listen, and keep you company. What would you like to talk about today?" })}
          style={styles.ctaBtn}
          accessibilityLabel="Start a conversation"
        >
          <Text style={styles.ctaText}>Start a Conversation</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>AI companion. For crises, contact a helpline.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  heading: { color: colors.text, fontSize: 24, fontWeight: "700", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    paddingBottom: 8,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: "#BB86FC" },
  tabText: { fontSize: 18, fontWeight: "600", color: colors.textCaption },
  tabTextActive: { color: colors.text },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, gap: 12 },
  list: { gap: 10 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#BB86FC",
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: "rgba(187,134,252,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardText: { flex: 1 },
  cardTitle: { color: colors.text, fontSize: 20, fontWeight: "600" },
  cardDesc: { color: colors.textMuted, fontSize: 16 },
  ctaBtn: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#BB86FC",
    alignItems: "center",
    marginTop: 4,
  },
  ctaText: { color: colors.background, fontSize: 18, fontWeight: "700" },
  disclaimer: { color: colors.textCaption, textAlign: "center", fontSize: 13, lineHeight: 20 },
});
