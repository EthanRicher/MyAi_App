import { useEffect, useRef, useState } from "react";
import { LayoutChangeEvent, Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { colors } from "../theme";

export interface ReaderMessage {
  role: "user" | "ai";
  text: string;
  label: string;
  warningText?: string;
}

interface Props {
  visible: boolean;
  messages: ReaderMessage[];
  accentColor?: string;
  onClose: () => void;
}

const MIN_SCALE = 0.15;
const MAX_SCALE = 0.7; // cap on how big the fullscreen text can grow

const BASE = {
  body: 36,
  bodyLine: 50,
  mainTitle: 46,
  mainTitleLine: 56,
  subTitle: 42,
  subTitleLine: 52,
  gap: 16,
  bulletGap: 12,
  mainPadH: 28,
  mainPadV: 20,
  mainRadius: 18,
  subPadH: 18,
  subPadV: 10,
  subRadius: 10,
  roleLabel: 26,
  roleLabelLine: 32,
  blockGap: 22,
  warningIcon: 28,
  warningText: 28,
  warningTextLine: 38,
  warningPadH: 20,
  warningPadV: 14,
  warningRadius: 14,
  warningGap: 14,
};

function renderFormatted(text: string, accentColor: string, s: number) {
  let mainTitleSeen = false;
  return text.split("\n").map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return null;

    const titleMatch = trimmed.match(/^\*\*([^*]+)\*\*:?$/);
    if (titleMatch) {
      const rawTitle = titleMatch[1].replace(/^:+|:+$/g, "").trim();
      if (!mainTitleSeen) {
        mainTitleSeen = true;
        return (
          <View
            key={i}
            style={{
              alignSelf: "stretch",
              borderWidth: 2,
              borderRadius: BASE.mainRadius * s,
              paddingHorizontal: BASE.mainPadH * s,
              paddingVertical: BASE.mainPadV * s,
              alignItems: "center",
              backgroundColor: accentColor + "33",
              borderColor: accentColor + "88",
            }}
          >
            <Text
              style={{
                fontSize: BASE.mainTitle * s,
                lineHeight: BASE.mainTitleLine * s,
                fontWeight: "800",
                textAlign: "center",
                color: accentColor,
              }}
            >
              {rawTitle}
            </Text>
          </View>
        );
      }
      return (
        <View
          key={i}
          style={{
            alignSelf: "stretch",
            backgroundColor: accentColor + "22",
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderTopColor: accentColor + "66",
            borderBottomColor: accentColor + "66",
            paddingHorizontal: BASE.subPadH * s,
            paddingVertical: BASE.subPadV * s,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: BASE.subTitle * s,
              lineHeight: BASE.subTitleLine * s,
              fontWeight: "700",
              color: accentColor,
              textAlign: "center",
            }}
          >
            {rawTitle}
          </Text>
        </View>
      );
    }

    const bulletMatch = trimmed.match(/^[-•*]\s+(.+)$/);
    if (bulletMatch) {
      return (
        <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", gap: BASE.bulletGap * s }}>
          <Text style={{ fontSize: BASE.body * s, lineHeight: BASE.bodyLine * s, color: accentColor }}>•</Text>
          <Text
            style={{
              flex: 1,
              fontSize: BASE.body * s,
              lineHeight: BASE.bodyLine * s,
              color: colors.text,
              fontWeight: "500",
            }}
          >
            {bulletMatch[1]}
          </Text>
        </View>
      );
    }

    return (
      <Text
        key={i}
        style={{
          fontSize: BASE.body * s,
          lineHeight: BASE.bodyLine * s,
          color: colors.text,
          fontWeight: "500",
        }}
      >
        {trimmed}
      </Text>
    );
  }).filter(Boolean);
}

export function MessageReaderModal({ visible, messages, accentColor = colors.primary, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [fontScale, setFontScale] = useState(1);
  const [ready, setReady] = useState(false);
  const [containerH, setContainerH] = useState(0);
  const [contentH, setContentH] = useState(0);
  const iterationsRef = useRef(0);
  const fontScaleRef = useRef(1);
  fontScaleRef.current = fontScale;

  const messagesKey = messages.map((m) => `${m.role}:${m.text}`).join("|");
  const pinnedWarning = messages.find((m) => m.role === "ai" && !!m.warningText)?.warningText;

  useEffect(() => {
    if (visible) {
      setFontScale(1);
      setReady(false);
      setContentH(0);
      iterationsRef.current = 0;
    }
  }, [visible, messagesKey]);

  useEffect(() => {
    if (ready || !containerH || !contentH) return;
    const target = containerH - 6;
    const ratio = target / contentH;
    const closeEnough = ratio >= 0.90 && ratio <= 1.03;
    if (closeEnough || iterationsRef.current >= 12) {
      setReady(true);
      return;
    }
    const current = fontScaleRef.current;
    const nextScale = current * Math.pow(ratio, 0.7);
    const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale));
    if (Math.abs(clamped - current) < 0.005) {
      setReady(true);
      return;
    }
    iterationsRef.current += 1;
    setFontScale(clamped);
  }, [containerH, contentH, ready]);

  const onContainerLayout = (e: LayoutChangeEvent) => {
    setContainerH(e.nativeEvent.layout.height);
  };

  const onContentLayout = (e: LayoutChangeEvent) => {
    if (ready) return;
    setContentH(e.nativeEvent.layout.height);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      transparent={false}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View
        style={[
          styles.container,
          { paddingTop: insets.top },
          messages.length === 1 && {
            backgroundColor: messages[0].role === "ai" ? "#222268" : colors.card,
          },
        ]}
      >
        <View style={styles.bodyWrap} onLayout={onContainerLayout}>
          <View
            style={[styles.content, { opacity: ready ? 1 : 0, gap: BASE.blockGap * fontScale }]}
            onLayout={onContentLayout}
          >
            {messages.map((m, idx) => {
              const labelColor = m.role === "ai" ? accentColor : colors.textMuted;
              const isPair = messages.length > 1;
              const bubbleBg = m.role === "ai" ? "#222268" : colors.card;
              return (
                <View
                  key={idx}
                  style={[
                    { gap: BASE.gap * fontScale },
                    isPair && {
                      backgroundColor: bubbleBg,
                      borderRadius: 18 * fontScale,
                      padding: 20 * fontScale,
                    },
                  ]}
                >
                  {isPair && (
                    <Text
                      style={{
                        fontSize: BASE.roleLabel * fontScale,
                        lineHeight: BASE.roleLabelLine * fontScale,
                        fontWeight: "800",
                        color: labelColor,
                        letterSpacing: 0.5,
                      }}
                    >
                      {m.label}
                    </Text>
                  )}
                  <View style={{ gap: BASE.gap * fontScale }}>
                    {renderFormatted(m.text, accentColor, fontScale)}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {!!pinnedWarning && (
          <View style={[styles.warningBanner, { marginTop: BASE.blockGap * fontScale }]}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.warningText}>{pinnedWarning}</Text>
          </View>
        )}

        <TouchableOpacity
          onPress={onClose}
          activeOpacity={0.85}
          style={[styles.closeBtn, { backgroundColor: accentColor, marginBottom: insets.bottom + 12 }]}
          accessibilityLabel="Close"
          accessibilityRole="button"
        >
          <X size={18} color="#fff" />
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  bodyWrap: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 0,
    justifyContent: "flex-start",
    overflow: "hidden",
  },
  content: {
    width: "100%",
  },
  closeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 46,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 14,
  },
  closeText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(249,168,37,0.15)",
    borderWidth: 2,
    borderColor: "#F9A825",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 4,
  },
  warningIcon: {
    fontSize: 18,
    lineHeight: 24,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: "#FFD54F",
    fontWeight: "600",
  },
});
