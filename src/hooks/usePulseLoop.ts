import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";

// Shared "breathing" pulse animation. Returns an Animated.Value that loops
// 0 → 1 → 0 with eased timing while `active` is true, and snaps back to 0
// when it flips false. Native driver = safe to apply to opacity/transform
// of an absolutely-positioned overlay without blocking JS.
//
// Used by the chat record button, the SenseGuard log popup record button,
// and the MedView scan-prescription button — same vibe everywhere.
export function usePulseLoop(active: boolean, durationMs: number = 900): Animated.Value {
  const value = useRef(new Animated.Value(0)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (active) {
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
      loopRef.current?.stop();
      value.setValue(0);
    }
    return () => loopRef.current?.stop();
  }, [active, durationMs]);

  return value;
}
