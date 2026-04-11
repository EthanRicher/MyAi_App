import { useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { colors } from "../theme";

type Nav = NativeStackNavigationProp<RootStackParamList, "Splash">;

export function SplashScreen() {
  const navigation = useNavigation<Nav>();

  useEffect(() => {
    const t = setTimeout(() => navigation.replace("Landing"), 2500);
    return () => clearTimeout(t);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MyAI</Text>
      <Text style={styles.subtitle}>Your Companion for Everyday Life</Text>
      <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  title: {
    fontSize: 54,
    fontWeight: "700",
    color: colors.primary,
  },
  subtitle: {
    fontSize: 18,
    color: colors.textMuted,
  },
  spinner: {
    marginTop: 32,
  },
});
