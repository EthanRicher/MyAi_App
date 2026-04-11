import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Search, Pill, Heart, Brain, Shield, ChevronRight } from "lucide-react-native";
import { BackButton } from "../components/BackButton";
import { RootStackParamList } from "../navigation/AppNavigator";
import { colors } from "../theme";

type Nav = NativeStackNavigationProp<RootStackParamList, "Home">;

const modules = [
  { name: "Clarity Layer", desc: "Understand complex medical information clearly", icon: Search, color: "#0dd9f7", screen: "Clarity" },
  { name: "MedView", desc: "Manage your medications", icon: Pill, color: "#4CAF50", screen: "MedView" },
  { name: "SenseGuard", desc: "Track your symptoms and overall wellbeing", icon: Heart, color: "#FF9800", screen: "SenseGuard" },
  { name: "Companion", desc: "Chat, stories and daily support", icon: Brain, color: "#BB86FC", screen: "Companion" },
  { name: "SafeHarbour", desc: "Stay safe and secure online", icon: Shield, color: "#F44336", screen: "SafeHarbour" },
] as const;

export function HomeMenu() {
  const navigation = useNavigation<Nav>();

  return (
    <View style={styles.container}>
      <BackButton label="Back to Home" to="Main" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>What would you like to explore?</Text>
        <View style={styles.list}>
          {modules.map((m) => (
            <TouchableOpacity
              key={m.name}
              onPress={() => navigation.navigate(m.screen as any)}
              style={[styles.card, { borderColor: m.color }]}
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  heading: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 16,
  },
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 2,
  },
  iconWrap: {
    width: 56,
    height: 56,
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
