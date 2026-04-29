import { useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet, Image } from "react-native";
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
      <Image
        source={require("../assets/Logo_Full.png")}
        style={styles.logoFull}
        resizeMode="contain"
      />
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
  logoFull: {
    width: 280,
    height: 120,
  },
  subtitle: {
    fontSize: 18,
    color: colors.textMuted,
  },
  spinner: {
    marginTop: 32,
  },
});
