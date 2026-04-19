import { TouchableOpacity, Text, View, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { colors } from "../theme";

interface Props {
  label?: string;
  to?: string;
  right?: React.ReactNode;
  hideTitle?: boolean;
}

export function BackButton({ label = "Back", to, right, hideTitle }: Props) {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const handlePress = () => {
    if (to) {
      navigation.navigate(to);
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={[styles.bar, { paddingTop: insets.top + 8 }]}>
      <TouchableOpacity
        style={styles.exitBtn}
        onPress={handlePress}
        accessibilityLabel={`Go back to ${label}`}
      >
        <ChevronLeft size={22} color="#fff" strokeWidth={2.5} />
      </TouchableOpacity>

      {!hideTitle
        ? <Text style={styles.title}>{label}</Text>
        : <View style={styles.titleSpacer} />
      }

      <View style={styles.rightSlot}>
        {right ?? null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: colors.card,
  },
  exitBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E53935",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    textAlign: "center",
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
  },
  spacer: {
    width: 36,
  },
  side: {
    width: 110,
    alignItems: "flex-start",
  },
  sideRight: {
    alignItems: "flex-end",
  },
  titleSpacer: {
    flex: 1,
  },
  rightSlot: {
    alignItems: "flex-end",
  },
});
