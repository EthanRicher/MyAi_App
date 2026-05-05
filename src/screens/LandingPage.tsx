import { View, TouchableOpacity, StyleSheet, Image, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RootStackParamList } from "../navigation/AppNavigator";
import { colors } from "../theme";

/**
 * Landing page. Sits between the splash and the login flow with a
 * single Sign In button so first-time users have a clear entry
 * point.
 */

type Nav = NativeStackNavigationProp<RootStackParamList, "Landing">;

export function LandingPage() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <View style={styles.logoWrap}>
        <Image
          source={require("../assets/Logo_Full.png")}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="MySafe"
        />
      </View>
      <TouchableOpacity
        style={styles.signInBtn}
        onPress={() => navigation.navigate("Login")}
        accessibilityLabel="Sign In"
      >
        <Text style={styles.signInText}>Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 32,
    alignItems: "center",
  },
  logoWrap: {
    flex: 1,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: "100%",
    maxWidth: 360,
    aspectRatio: 1,
  },
  signInBtn: {
    width: "100%",
    maxWidth: 320,
    height: 58,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  signInText: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.background,
  },
});
