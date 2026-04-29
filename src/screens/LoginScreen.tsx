import { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Eye, EyeOff } from "lucide-react-native";
import { RootStackParamList } from "../navigation/AppNavigator";
import { colors } from "../theme";

type Nav = NativeStackNavigationProp<RootStackParamList, "Login">;

export function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<"passcode" | "pin">("passcode");
  const [passcode, setPasscode] = useState("");
  const [pin, setPin] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = () => {
    const value = tab === "passcode" ? passcode : pin;
    if (value === "1234") {
      navigation.replace("Main");
    } else {
      const next = attempts + 1;
      setAttempts(next);
      shake();
      if (next >= 3) navigation.replace("Lockout");
    }
  };

  const handlePinPress = (digit: string) => {
    if (pin.length < 6) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 6) {
        setTimeout(() => {
          if (newPin === "123456") {
            navigation.replace("Main");
          } else {
            const next = attempts + 1;
            setAttempts(next);
            shake();
            setPin("");
            if (next >= 3) navigation.replace("Lockout");
          }
        }, 200);
      }
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 16 }]}>
      <View style={styles.logoZone}>
        <Image
          source={require("../assets/Logo_Full.png")}
          style={styles.logoFull}
          resizeMode="contain"
        />
        <Text style={styles.subtitle}>Welcome back</Text>
      </View>

      <Animated.View style={[styles.card, { transform: [{ translateX: shakeAnim }] }]}>
        {/* Tabs */}
        <View style={styles.tabs}>
          {(["passcode", "pin"] as const).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t)}
              style={[styles.tab, tab === t && styles.tabActive]}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === "passcode" ? "Passcode" : "6-Digit PIN"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === "passcode" ? (
          <View style={styles.section}>
            <View style={styles.inputRow}>
              <TextInput
                secureTextEntry={!showPass}
                value={passcode}
                onChangeText={setPasscode}
                placeholder="Enter your passcode"
                placeholderTextColor={colors.textCaption}
                style={styles.textInput}
                onSubmitEditing={handleLogin}
                returnKeyType="done"
                accessibilityLabel="Passcode input"
              />
              <TouchableOpacity
                onPress={() => setShowPass(!showPass)}
                style={styles.eyeBtn}
                accessibilityLabel={showPass ? "Hide passcode" : "Show passcode"}
              >
                {showPass ? <EyeOff size={20} color={colors.textCaption} /> : <Eye size={20} color={colors.textCaption} />}
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.signInBtn} onPress={handleLogin} accessibilityLabel="Sign in">
              <Text style={styles.signInText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.pinDots}>
              {Array.from({ length: 6 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    { backgroundColor: i < pin.length ? colors.primary : "transparent" },
                  ]}
                />
              ))}
            </View>
            <View style={styles.numGrid}>
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((d) =>
                d === "" ? (
                  <View key="empty" style={styles.numKey} />
                ) : (
                  <TouchableOpacity
                    key={d}
                    onPress={() => {
                      if (d === "⌫") setPin(pin.slice(0, -1));
                      else handlePinPress(d);
                    }}
                    style={styles.numKey}
                    accessibilityLabel={d === "⌫" ? "Delete" : `Digit ${d}`}
                  >
                    <Text style={styles.numText}>{d}</Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          </View>
        )}

        {attempts > 0 && attempts < 3 && (
          <Text style={styles.errorText}>
            Incorrect. {3 - attempts} attempt{3 - attempts !== 1 ? "s" : ""} remaining.
          </Text>
        )}
      </Animated.View>

      <Text style={styles.hint}>Hint: passcode "1234" or PIN "123456"</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  logoZone: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  logoFull: {
    width: 340,
    height: 200,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
    marginBottom: 32,
  },
  card: {
    width: "100%",
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
  },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingBottom: 12,
    alignItems: "center",
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.textCaption,
  },
  tabTextActive: {
    color: colors.text,
  },
  section: {
    gap: 16,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  textInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    paddingVertical: 14,
  },
  eyeBtn: {
    padding: 4,
  },
  signInBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
  },
  signInText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.background,
  },
  pinDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 8,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  numGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  numKey: {
    width: "30%",
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  numText: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.text,
  },
  errorText: {
    color: colors.destructive,
    textAlign: "center",
    marginTop: 16,
    fontSize: 14,
  },
  hint: {
    color: colors.textCaption,
    fontSize: 14,
    marginTop: 24,
  },
});
