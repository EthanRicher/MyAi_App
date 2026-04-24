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
  const inChat = !!right;

  const handlePress = () => {
    if (to) {
      navigation.navigate(to);
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={[styles.bar, { paddingTop: insets.top + 4 }]}>
      <TouchableOpacity
        style={[styles.exitBtn, inChat ? styles.exitBtnChat : styles.exitBtnSmall]}
        onPress={handlePress}
        accessibilityLabel={`Go back to ${label}`}
      >
        <ChevronLeft size={inChat ? 20 : 22} color="#fff" strokeWidth={2.5} />
        <Text style={[styles.exitLabel, inChat ? styles.exitLabelChat : styles.exitLabelSmall]}>Back</Text>
      </TouchableOpacity>

      {!hideTitle && (
        <View style={styles.titleAbsolute} pointerEvents="none">
          <Text style={styles.title} numberOfLines={1}>{label}</Text>
        </View>
      )}

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
    paddingLeft: 6,
    paddingRight: 16,
    paddingBottom: 6,
    backgroundColor: colors.card,
  },
  exitBtn: {
    borderRadius: 8,
    backgroundColor: "#E53935",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 2,
  },
  exitBtnChat: {
    height: 36,
    width: 110,
    justifyContent: "center",
    alignItems: "center",
  },
  exitBtnSmall: {
    height: 36,
    paddingHorizontal: 8,
  },
  exitLabel: {
    color: "#fff",
    fontWeight: "700",
    textAlign: "center",
    textAlignVertical: "center",
    includeFontPadding: false,
  },
  exitLabelChat: {
    fontSize: 15,
  },
  exitLabelSmall: {
    fontSize: 16,
  },
  titleAbsolute: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 6,
    alignItems: "center",
    pointerEvents: "none",
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  rightSlot: {
    marginLeft: "auto",
    alignItems: "flex-end",
  },
});
