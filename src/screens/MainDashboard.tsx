import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Mic, Settings, Lightbulb, LogOut } from "lucide-react-native";
import { RootStackParamList } from "../navigation/AppNavigator";
import { colors } from "../theme";

type Nav = NativeStackNavigationProp<RootStackParamList, "Main">;

export function MainDashboard() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => navigation.replace("Splash")}
          style={styles.topBtn}
          accessibilityLabel="Logout"
        >
          <LogOut size={24} color="#F44336" />
          <Text style={[styles.topBtnText, { color: "#F44336" }]}>Logout</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate("Settings")}
          style={styles.topBtn}
          accessibilityLabel="Settings"
        >
          <Settings size={24} color={colors.textMuted} />
          <Text style={[styles.topBtnText, { color: colors.textMuted }]}>Settings</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <Text style={styles.greeting}>Hello, Margaret</Text>
        <Text style={styles.sub}>How can I help you today?</Text>

        <TouchableOpacity
          onPress={() => navigation.navigate("ClarityRecord")}
          style={styles.recordBtn}
          accessibilityLabel="Tap to record a conversation"
        >
          <Mic size={52} color={colors.text} strokeWidth={2.5} />
          <Text style={styles.recordLabel}>Record</Text>
        </TouchableOpacity>
        <Text style={styles.recordHint}>Tap to record a conversation</Text>

        <TouchableOpacity
          onPress={() => navigation.navigate("Home")}
          style={styles.exploreBtn}
          accessibilityLabel="Explore features"
        >
          <Text style={styles.exploreBtnText}>Explore Features</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("Companion")}
          style={styles.promptCard}
          accessibilityLabel="Daily prompt - reflect on your day"
        >
          <Lightbulb size={26} color={colors.yellow} />
          <Text style={styles.promptText}>Would you like to reflect on your day?</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 8,
  },
  topBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  topBtnText: {
    fontSize: 18,
    fontWeight: "600",
  },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  greeting: {
    color: colors.text,
    fontSize: 36,
    fontWeight: "700",
    textAlign: "center",
  },
  sub: {
    color: colors.textMuted,
    fontSize: 22,
    textAlign: "center",
  },
  recordBtn: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "#E53935",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    gap: 8,
    shadowColor: "#E53935",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 10,
  },
  recordLabel: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "600",
  },
  recordHint: {
    color: colors.textCaption,
    fontSize: 18,
  },
  exploreBtn: {
    width: "100%",
    maxWidth: 300,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: "center",
  },
  exploreBtnText: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: "700",
  },
  promptCard: {
    width: "100%",
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  promptText: {
    color: colors.textMuted,
    fontSize: 18,
    flex: 1,
  },
  yellow: {
    color: colors.yellow,
  },
});
