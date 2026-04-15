import { TouchableOpacity, Text, View, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { colors } from "../theme";

interface Props {
  label?: string;
  to?: string;
}

export function BackButton({ label = "Back", to }: Props) {
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

      <Text style={styles.title}>{label}</Text>

      {/* Spacer to balance the exit button */}
      <View style={styles.spacer} />
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
    fontSize: 20,
    fontWeight: "700",
  },
  spacer: {
    width: 36,
  },
});
