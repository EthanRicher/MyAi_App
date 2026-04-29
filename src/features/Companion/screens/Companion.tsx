import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ChevronRight } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackButton } from "../../../components/BackButton";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors } from "../../../theme";
import { conversationCards, storiesCards } from "../data/Companion.data";

type Nav = NativeStackNavigationProp<RootStackParamList, "Companion">;

export function Companion() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<"conversation" | "stories">("conversation");
  const cards = tab === "conversation" ? conversationCards : storiesCards;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 12 }]}>
      <BackButton label="Companion" to="Home" />

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
    paddingVertical: 14,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: "#BB86FC" },
  tabText: { fontSize: 22, fontWeight: "600", color: colors.textCaption },
  tabTextActive: { color: colors.text },
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
});
