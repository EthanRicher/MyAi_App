import { Text, TouchableOpacity, View } from "react-native";
import { styles } from "./styles";

/**
 * Empty-state suggestion chips. Shown when the chat is blank and
 * the user has starter prompts turned on. Tapping a chip just
 * sends the prompt as if the user had typed it.
 */

interface Props {
  prompts: string[];                   // Suggestion text shown on each chip.
  accentColor: string;                 // Theme tint for chip border and text.
  onSelect: (prompt: string) => void;  // Fired when a chip is tapped.
}

export function StarterPrompts({ prompts, accentColor, onSelect }: Props) {
  return (
    <View style={styles.starterPromptsWrap}>
      {prompts.map((prompt) => (
        <TouchableOpacity
          key={prompt}
          onPress={() => onSelect(prompt)}
          style={[styles.starterChip, { borderColor: accentColor + "88", backgroundColor: accentColor + "14" }]}
        >
          <Text style={[styles.starterChipText, { color: accentColor }]}>{prompt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
