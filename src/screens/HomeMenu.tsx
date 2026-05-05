import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Search, Pill, Heart, Brain, Shield, ChevronRight, FileText } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackButton } from "../components/BackButton";
import { RootStackParamList } from "../navigation/AppNavigator";
import { colors } from "../theme";

/**
 * Home menu screen. The grid of feature tiles (Docs, Clarity,
 * MedView, Companion, SenseGuard, SafeHarbour) the user lands on
 * after the dashboard. Tapping a tile routes into that feature.
 */

type Nav = NativeStackNavigationProp<RootStackParamList, "Home">;

// One tile per top-level feature, in display order.
const modules = [
  { name: "Docs", desc: "Saved letters, plans, memories and notes", icon: FileText, color: "#FF9800", screen: "Docs", dashed: true },
  { name: "Clarity Layer", desc: "Make medical info simple", icon: Search, color: "#0dd9f7", screen: "Clarity", dashed: false },
  { name: "MedView", desc: "Manage your medications", icon: Pill, color: "#4CAF50", screen: "MedView", dashed: false },
  { name: "Companion", desc: "Chat, stories and daily support", icon: Brain, color: "#BB86FC", screen: "Companion", dashed: false },
  { name: "SenseGuard", desc: "Log symptoms and track your wellbeing", icon: Heart, color: "#F472B6", screen: "SenseGuard", dashed: false },
  { name: "SafeHarbour", desc: "Check messages, emails or photos for scams", icon: Shield, color: "#F44336", screen: "SafeHarbour", dashed: false },
] as const;

export function HomeMenu() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 12 }]}>
      <BackButton label="Home" to="Main" />
      <View style={styles.list}>
        {modules.map((m) => (
          <TouchableOpacity
            key={m.name}
            onPress={() => navigation.navigate(m.screen as any)}
            style={[
              styles.card,
              { borderColor: m.color },
              m.dashed && styles.cardDashed,
            ]}
            accessibilityLabel={`Go to ${m.name}`}
          >
            <View style={[styles.iconWrap, { backgroundColor: m.color + "20" }]}>
              <m.icon size={30} color={m.color} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardName}>{m.name}</Text>
              <Text style={styles.cardDesc}>{m.desc}</Text>
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
    borderWidth: 2,
  },
  cardDashed: {
    borderStyle: "dashed",
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardText: {
    flex: 1,
  },
  cardName: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "700",
  },
  cardDesc: {
    color: colors.textMuted,
    fontSize: 16,
    marginTop: 2,
  },
});
