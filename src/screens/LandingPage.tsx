import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { colors } from "../theme";

type Nav = NativeStackNavigationProp<RootStackParamList, "Landing">;

export function LandingPage() {
  const navigation = useNavigation<Nav>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MyAI</Text>
      <Text style={styles.subtitle}>
        A friendly companion to help you understand medical information, manage medications, and feel supported every day.
      </Text>
      <TouchableOpacity
        style={styles.signInBtn}
        onPress={() => navigation.navigate("Login")}
        accessibilityLabel="Sign In"
      >
        <Text style={styles.signInText}>Sign In</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.learnBtn} accessibilityLabel="Learn More">
        <Text style={styles.learnText}>Learn More</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 24,
  },
  title: {
    fontSize: 44,
    fontWeight: "700",
    color: colors.primary,
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 29,
    color: colors.textMuted,
    textAlign: "center",
    maxWidth: 320,
  },
  signInBtn: {
    width: "100%",
    maxWidth: 320,
    height: 58,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  signInText: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.background,
  },
  learnBtn: {
    marginTop: 8,
  },
  learnText: {
    fontSize: 16,
    color: colors.primary,
  },
});
