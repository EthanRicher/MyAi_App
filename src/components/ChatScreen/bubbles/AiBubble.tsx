import { Image, Text, TouchableOpacity, View } from "react-native";
import type { ChatMessage } from "../types";
import { renderMessageContent } from "../helpers";
import { styles } from "../styles";

/**
 * One AI message bubble. Can hold an image, plain or markdown text,
 * an error message or a warning banner, and tapping it opens the
 * full-screen reader for easier reading.
 */

interface Props {
  message: ChatMessage;       // The bubble data.
  accentColor: string;        // Theme colour for headings and the hint chip.
  aiLabel: string;            // Name shown above the bubble.
  onOpenReader: () => void;   // Fired when the bubble is tapped or long-pressed.
}

export function AiBubble({ message, accentColor, aiLabel, onOpenReader }: Props) {
  // Only allow tap-to-open when there's actual content worth reading.
  const tappable = !!message.text && !message.isError;

  return (
    <View style={styles.aiBubbleWrap}>
      <TouchableOpacity
        activeOpacity={tappable ? 0.8 : 1}
        onPress={onOpenReader}
        onLongPress={onOpenReader}
        style={styles.aiBubble}
        accessibilityHint={tappable ? "Tap to read in full screen" : undefined}
      >
        {/* Header. Name plus timestamp. */}
        <View style={styles.bubbleLabelRow}>
          <Text style={[styles.aiLabel, { color: accentColor }]}>{aiLabel}</Text>
          {!!message.timestamp && <Text style={styles.timestamp}>{message.timestamp}</Text>}
        </View>

        {!!message.imageUri && (
          <Image source={{ uri: message.imageUri }} style={styles.messageImage} />
        )}

        {/* Errors render flat; normal replies go through the markdown renderer. */}
        {!!message.text && (message.isError
          ? <Text style={styles.errorBubbleText}>{message.text}</Text>
          : renderMessageContent(message.text, accentColor, styles.messageText)
        )}

        {/* "Tap here to fullscreen" hint, only when the bubble is actually tappable. */}
        {tappable && (
          <View style={styles.fullscreenHintWrap}>
            <View style={[styles.fullscreenHint, { borderColor: accentColor + "66", backgroundColor: accentColor + "22" }]}>
              <Text style={[styles.fullscreenHintText, { color: accentColor }]}>Tap here to fullscreen</Text>
            </View>
          </View>
        )}

        {/* Warning strip pinned to the bottom when the reply earned one. */}
        {!!message.warningText && (
          <View style={styles.messageWarningBanner}>
            <Text style={styles.messageWarningIcon}>⚠️</Text>
            <Text style={styles.messageWarningText}>{message.warningText}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}
