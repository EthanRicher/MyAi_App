import { Text, View } from "react-native";
import { styles } from "../styles";

/**
 * The little "Typing..." placeholder shown while the AI is working.
 * Mirrors the shape of an AI bubble so the layout doesn't jump when
 * the real reply lands.
 */

interface Props {
  accentColor: string; // Theme tint for the name label.
  aiLabel: string;     // Name shown above the placeholder.
  typingLabel: string; // Text shown in the body (e.g. "Typing...").
}

export function TypingBubble({ accentColor, aiLabel, typingLabel }: Props) {
  return (
    <View style={styles.aiBubbleWrap}>
      <View style={styles.aiBubble}>
        <Text style={[styles.aiLabel, { color: accentColor }]}>{aiLabel}</Text>
        <Text style={styles.messageText}>{typingLabel}</Text>
      </View>
    </View>
  );
}
