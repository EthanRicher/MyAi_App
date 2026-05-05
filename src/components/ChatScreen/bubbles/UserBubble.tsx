import { Image, Text, TouchableOpacity, View } from "react-native";
import type { ChatMessage } from "../types";
import { scanKeywords } from "../../../backend/2_Checks/Text/B_Check_Keywords";
import { styles } from "../styles";

/**
 * One user message bubble. As well as the message itself, this is
 * where the two safety flags show up. The keyword scan paints
 * matched words as red pills inline, and the AI-only flag adds a
 * soft orange left border plus a small "AI flag" pill.
 */

interface Props {
  message: ChatMessage;       // The bubble data.
  userFirstName: string;      // Label shown above the bubble.
  onOpenReader: () => void;   // Fired when the bubble is tapped or long-pressed.
}

export function UserBubble({ message, userFirstName, onOpenReader }: Props) {
  const tappable = !!message.text;

  return (
    <View style={styles.userBubbleWrap}>
      <TouchableOpacity
        activeOpacity={tappable ? 0.8 : 1}
        onPress={onOpenReader}
        onLongPress={onOpenReader}
        style={[
          styles.userBubble,
          message.imageUri && !message.text ? styles.photoBubble : undefined,
          message.aiFlagged ? styles.userBubbleAiFlagged : undefined,
        ]}
        accessibilityHint={tappable ? "Tap to read in full screen" : undefined}
      >
        {/* Header. First name (with translation suffix when needed), AI flag pill, timestamp. */}
        <View style={styles.bubbleLabelRow}>
          <Text style={styles.userLabel}>
            {message.isTranslation ? `${userFirstName} · Translated to English` : userFirstName}
          </Text>
          {message.aiFlagged && (
            <View style={styles.aiFlagPill}>
              <Text style={styles.aiFlagPillText}>AI flag</Text>
            </View>
          )}
          {!!message.timestamp && <Text style={styles.timestamp}>{message.timestamp}</Text>}
        </View>

        {!!message.imageUri && (
          <Image source={{ uri: message.imageUri }} style={styles.messageImage} />
        )}

        {/* Each word is its own Text node so flagged keywords can drop in as red pills inline. */}
        {!!message.text && !message.imageUri && (
          <View style={styles.userBubbleTextRow}>
            {scanKeywords(message.text).flatMap((seg, j) => {
              if (seg.kind === "flag") {
                return [
                  <View key={`f${j}`} style={styles.flagPill}>
                    <Text style={styles.flagPillText}>{seg.text}</Text>
                  </View>,
                ];
              }
              return seg.text
                .split(/(\s+)/)
                .filter((w) => w.length > 0 && !/^\s+$/.test(w))
                .map((w, k) => (
                  <Text key={`t${j}-${k}`} style={styles.userBubbleText}>
                    {w}
                  </Text>
                ));
            })}
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}
