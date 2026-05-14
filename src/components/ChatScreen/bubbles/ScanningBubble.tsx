import { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";
import { styles } from "../styles";

/**
 * Placeholder bubble shown while a photo is being processed (vision /
 * OCR + the AI call that follows). Mirrors the layout of an AI
 * bubble so nothing jumps when the real reply lands, and pulses the
 * whole bubble's opacity gently to signal active work — distinct
 * from the static TypingBubble used for text-only turns.
 */

interface Props {
  accentColor: string;            // Theme tint for the name label.
  aiLabel: string;                // Name shown above the placeholder.
  scanningLabel?: string;         // Body copy (defaults to "Scanning...").
}

const PULSE_MIN = 0.45;
const PULSE_MAX = 1;
const PULSE_HALF_MS = 850;

export function ScanningBubble({ accentColor, aiLabel, scanningLabel = "Scanning..." }: Props) {
  const opacity = useRef(new Animated.Value(PULSE_MIN)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: PULSE_MAX,
          duration: PULSE_HALF_MS,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: PULSE_MIN,
          duration: PULSE_HALF_MS,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <View style={styles.aiBubbleWrap}>
      <Animated.View style={[styles.aiBubble, { opacity }]}>
        <Text style={[styles.aiLabel, { color: accentColor }]}>{aiLabel}</Text>
        <Text style={styles.messageText}>{scanningLabel}</Text>
      </Animated.View>
    </View>
  );
}
