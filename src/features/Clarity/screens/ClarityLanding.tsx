import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ChevronRight } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackButton } from "../../../components/BackButton";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors } from "../../../theme";
import { clarityLandingCards as cards } from "../data/ClarityLanding.data";

type Nav = NativeStackNavigationProp<RootStackParamList, "Clarity">;

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
