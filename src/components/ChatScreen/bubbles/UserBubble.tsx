import { Image, Text, TouchableOpacity, View } from "react-native";
import type { ChatMessage } from "../types";
import { scanKeywords } from "../../../backend/2_Checks/Text/B_Check_Keywords";
import { styles } from "../styles";
import { colors } from "../../../theme";

/**
 * One user message bubble. As well as the message itself, this is
 * where the safety flags show up. The keyword scan paints matched
 * words as red pills inline, the AI-only flag adds a soft orange
 * left border plus a small "AI flag" pill, and the distress tier
 * (when the user's message tripped AMBER / RED) adds a coloured
 * left strip plus an "AI flag" chip — orange for AMBER, red for RED
 * — next to the user's name.
 */

/**
 * Mapping from distress guard tier → chip colour. Both tiers render
 * with the same "AI flag" label; the colour is what tells AMBER
 * (orange) from RED (red) at a glance.
 */
const DISTRESS_TIER_META: Record<NonNullable<ChatMessage["distressTier"]>, { color: string; label: string }> = {
  amber: { color: colors.orange, label: "AI flag" },
  red: { color: colors.destructive, label: "AI flag" },
};

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
          message.distressTier === "amber" ? styles.userBubbleAmberFlag : undefined,
          message.distressTier === "red" ? styles.userBubbleRedFlag : undefined,
        ]}
        accessibilityHint={tappable ? "Tap to read in full screen" : undefined}
      >
        {/* Header. Name + chips on the left, timestamp on the right. */}
        <View style={styles.bubbleLabelRow}>
          <View style={styles.userLabelGroup}>
            <Text style={styles.userLabel}>{userFirstName}</Text>
            {message.isTranslation && (
              <View style={styles.translatedChip} accessibilityLabel="Translated to English">
                <Text style={styles.translatedChipText}>Translated</Text>
              </View>
            )}
            {/* Show the AI-second-pass flag only when no distress tier
                has fired. The distress chip is more specific, so let
                it own the bubble alone when it's present. */}
            {message.aiFlagged && !message.distressTier && (
              <View style={styles.aiFlagPill}>
                <Text style={styles.aiFlagPillText}>AI flag</Text>
              </View>
            )}
            {message.distressTier && (
              <View
                style={[styles.distressTierChip, { backgroundColor: DISTRESS_TIER_META[message.distressTier].color }]}
                accessibilityLabel={`Distress guard tier: ${DISTRESS_TIER_META[message.distressTier].label}`}
              >
                <Text style={styles.distressTierChipText}>
                  {DISTRESS_TIER_META[message.distressTier].label}
                </Text>
              </View>
            )}
          </View>
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
