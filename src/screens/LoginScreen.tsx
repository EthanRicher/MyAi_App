import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Image,
  LayoutAnimation,
  Platform,
  UIManager,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Eye, EyeOff } from "lucide-react-native";
import { RootStackParamList } from "../navigation/AppNavigator";
import { colors } from "../theme";

type Nav = NativeStackNavigationProp<RootStackParamList, "Login">;

// Enable LayoutAnimation on Android (it's iOS-only by default).
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Smooth height tween — tweens with a flat easeOut curve so the card
// settles cleanly without any spring bounce that would otherwise push the
// inner inputs back down after the layout already finished.
const EXPAND_DURATION = 360;
const EXPAND_PRESET = {
  duration: EXPAND_DURATION,
  update: {
    type: LayoutAnimation.Types.easeInEaseOut,
  },
  create: {
    type: LayoutAnimation.Types.easeOut,
    property: LayoutAnimation.Properties.opacity,
  },
};

// Distance the form content travels up while fading in — keeps the slide
// readable without overshooting.
const FORM_RISE = 24;

export function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<"passcode" | "pin">("passcode");
  const [passcode, setPasscode] = useState("");
  const [pin, setPin] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const formTranslate = useRef(new Animated.Value(FORM_RISE)).current;
  const hintOpacity = useRef(new Animated.Value(0)).current;

  // When expanded becomes true, the LayoutAnimation tweens the card height
  // open while the form content slides up + fades in. We deliberately keep
  // the slide-up SHORTER than the layout tween so it finishes first — that
  // way nothing keeps moving once the layout has settled (no late drift).
  // The hint fades in last as a small staged reveal.
  useEffect(() => {
    if (!expanded) return;
    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(formTranslate, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start();
    Animated.timing(hintOpacity, {
      toValue: 1,
      duration: 260,
      delay: 180,
      useNativeDriver: true,
    }).start();
  }, [expanded]);

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

  const onSignInPressed = () => {
    if (!expanded) {
      LayoutAnimation.configureNext(EXPAND_PRESET);
      setExpanded(true);
      return;
    }
    handleLogin();
  };

  // Switching tabs uses LayoutAnimation to tween the card height to the new
  // section's size. The sectionClip's overflow: hidden gradually reveals
  // the new content as the card grows — no per-section translate needed,
  // which avoids any chance of the section's bottom being clipped while
  // it animates over the divider line below.
  const onTabChange = (t: "passcode" | "pin") => {
    if (t === tab) return;
    LayoutAnimation.configureNext(EXPAND_PRESET);
    setTab(t);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
    <View style={[styles.container, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 16 }]}>
      <View pointerEvents="none" style={styles.logoBackgroundWrap}>
        <Image
          source={require("../assets/Logo_Full.png")}
          style={styles.logoBackground}
          resizeMode="contain"
        />
      </View>

      <View style={styles.spacer} />

      <Animated.Text style={[styles.hint, { opacity: hintOpacity }]}>
        Hint: passcode "1234" or PIN "123456"
      </Animated.Text>

      <Animated.View style={[styles.card, { transform: [{ translateX: shakeAnim }] }]}>
        {expanded && (
          <Animated.View
            style={[
              styles.formZone,
              {
                opacity: contentOpacity,
                transform: [{ translateY: formTranslate }],
              },
            ]}
          >
            <View style={styles.tabs}>
              {(["passcode", "pin"] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => onTabChange(t)}
                  style={[styles.tab, tab === t && styles.tabActive]}
                >
                  <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                    {t === "passcode" ? "Passcode" : "6-Digit PIN"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.sectionClip}>
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
            </View>

            <View style={styles.errorSlot}>
              {attempts > 0 && attempts < 3 && (
                <Text style={styles.errorText}>
                  Incorrect. {3 - attempts} attempt{3 - attempts !== 1 ? "s" : ""} remaining.
                </Text>
              )}
            </View>
          </Animated.View>
        )}

        <View style={styles.signInArea}>
          {expanded && <View style={styles.signInDivider} />}
          <TouchableOpacity style={styles.signInBtn} onPress={onSignInPressed} accessibilityLabel="Sign in">
            <Text style={styles.signInText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
  },
  // Logo lives in the background (absolutely positioned) and is centered
  // within the TOP TWO-THIRDS of the screen, so it stays put when the card
  // springs open. paddingTop nudges the centered logo a bit DOWN within
  // that band (more space above center than below).
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
  spacer: {
    flex: 1,
  },
  hint: {
    color: colors.textCaption,
    fontSize: 14,
    marginBottom: 12,
    textAlign: "center",
    alignSelf: "stretch",
  },
  card: {
    alignSelf: "stretch",
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  formZone: {
    gap: 12,
  },
  // Clips the section's slide animation so it can't bleed into the SignIn
  // button area below.
  sectionClip: {
    overflow: "hidden",
  },
  // Reserved space for the "Incorrect..." line — keeps the layout from
  // shifting when the error appears or disappears.
  errorSlot: {
    minHeight: 20,
    justifyContent: "center",
  },
  // Sign In button has its own region at the bottom of the card with a
  // thin divider above so the form animations clearly stop at the line.
  signInArea: {
    gap: 12,
  },
  signInDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: -16,
  },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    fontSize: 14,
    fontWeight: "700",
  },
});
