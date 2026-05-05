import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";

/**
 * Shared "breathing" pulse animation. Returns an Animated.Value that
 * loops 0 to 1 to 0 with eased timing while active is true, and
 * snaps back to 0 when it flips false. Uses the native driver, so
 * it's safe to apply to opacity or transform on an absolutely
 * positioned overlay without blocking JS.
 *
 * Used by the chat record button, the SenseGuard log popup record
 * button, and the MedView scan-prescription button. Same vibe
 * everywhere.
 */
export function usePulseLoop(active: boolean, durationMs: number = 900): Animated.Value {
  const value = useRef(new Animated.Value(0)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (active) {
      // Build a fade-in then fade-out sequence and loop it forever.
      loopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: 1,
            duration: durationMs,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: durationMs,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      loopRef.current.start();
    } else {
      // Stop the loop and snap back to 0 so the overlay disappears cleanly.
      loopRef.current?.stop();
      value.setValue(0);
    }
    return () => loopRef.current?.stop();
  }, [active, durationMs]);

  return value;
}
