import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { colors } from "../theme";

/**
 * Splash screen. Shows the logo briefly then auto-navigates to
 * Login. The 2.5 second delay is a deliberate beat to let the brand
 * settle before the login flow starts.
 */

type Nav = NativeStackNavigationProp<RootStackParamList, "Splash">;

export function SplashScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const t = setTimeout(() => navigation.replace("Login"), 2500);
    return () => clearTimeout(t);
  }, [navigation]);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 32,
          paddingBottom: insets.bottom + 16,
        },
      ]}
    >
      {/* Logo positioned identically to the LoginScreen: centered in the
          top two-thirds of the screen, same size + same vertical nudge. */}
      <View pointerEvents="none" style={styles.logoBackgroundWrap}>
        <Image
          source={require("../assets/Logo_Full.png")}
          style={styles.logoBackground}
          resizeMode="contain"
        />
      </View>

      {/* Big spinner sits below the logo, in the bottom third where the
          login card would normally be. */}
      <View style={styles.spinnerZone}>
        <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
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
  logoBackgroundWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "66.66%",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 56,
  },
  logoBackground: {
    width: "92%",
    maxWidth: 360,
    aspectRatio: 1,
  },
  spinnerZone: {
    position: "absolute",
    top: "66.66%",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 80,
  },
  // Scale the system ActivityIndicator up — RN's size prop only takes
  // "small" / "large" cross-platform, so we apply a transform on top.
  spinner: {
    transform: [{ scale: 2.6 }],
  },
});
