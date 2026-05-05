import { Text, TouchableOpacity, View } from "react-native";
import { colors } from "../../../theme";
import type { ChatMessage } from "../types";
import { styles } from "../styles";

/**
 * The inline "tap to save" card. Shown after the AI produces
 * something the user might want to keep. Tapping the button hands
 * the suggested title and content back to the parent, which opens
 * the save modal pre-filled.
 */

interface Props {
  message: ChatMessage & { saveOffer: NonNullable<ChatMessage["saveOffer"]> }; // Bubble that carries a save offer.
  accentColor: string;                              // Theme tint for the card and button.
  aiLabel: string;                                  // Name shown above the offer.
  onSave: (content: string, title: string) => void; // Opens the save modal pre-filled.
}

export function SaveOfferBubble({ message, accentColor, aiLabel, onSave }: Props) {
  const offer = message.saveOffer;
  return (
    <View style={styles.aiBubbleWrap}>
      <View style={[styles.saveOfferCard, { borderColor: accentColor + "66", backgroundColor: accentColor + "16" }]}>
        <Text style={[styles.aiLabel, { color: accentColor }]}>{aiLabel}</Text>
        <Text style={styles.saveOfferText}>{offer.sentence}</Text>
        <TouchableOpacity
          onPress={() => onSave(offer.content, offer.title)}
          style={[styles.saveOfferBtn, { backgroundColor: accentColor }]}
          accessibilityLabel="Tap here to save"
        >
          <Text style={[styles.saveOfferBtnText, { color: colors.background }]}>Tap here to save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
