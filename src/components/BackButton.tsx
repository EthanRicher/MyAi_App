import { TouchableOpacity, Text, StyleSheet } from "react-native";
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
    <TouchableOpacity
      style={[styles.container, { paddingTop: insets.top + 8 }]}
      onPress={handlePress}
      accessibilityLabel={`Go back to ${label}`}
    >
      <ChevronLeft size={36} color={colors.text} strokeWidth={2} />
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: colors.card,
  },
  label: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "700",
  },
});
