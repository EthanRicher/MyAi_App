import { useEffect, useRef, useState } from "react";
import { LayoutChangeEvent, Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { colors, chatBubble, warningColors } from "../theme";
import { renderMarkdownWith, parseInline } from "../backend/6_Present/Present_Markdown";

/**
 * Full-screen "reader" modal opened when the user taps a chat
 * bubble. Shows one bubble blown up in big readable text, or a
 * paired user + AI exchange. Auto-fits the font scale so short
 * replies fill the screen and long ones still stay legible
 * (falling back to scrolling when the floor is hit).
 */

export interface ReaderMessage {
  role: "user" | "ai";
  text: string;
  label: string;
  warningText?: string; // Disclaimer pinned below the message when present.
}

interface Props {
  visible: boolean;             // Whether the modal is shown.
  messages: ReaderMessage[];    // One message, or a user / AI pair.
  accentColor?: string;         // Theme tint for headings + close button.
  onClose: () => void;
}

/**
 * Auto-fit floor. Text is allowed to shrink for fit, but the floor
 * is high enough to stay readable. At MIN_SCALE the body lands at
 * fontSize 36 * 0.5 = 18px. If content still overflows at this
 * scale the ScrollView takes over instead of going smaller.
 */
const MIN_SCALE = 0.5;
const MAX_SCALE = 0.7;

// Base font sizes / paddings for the largest scale. Multiplied by `s` at render time.
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
  roleLabel: 26,
  roleLabelLine: 32,
  blockGap: 22,
  bubbleRadius: 18,
  bubblePad: 20,
};

// Inline bold renderer. Uses a heavier weight than the chat bubble so it pops at large size.
const renderInline = (text: string) =>
  parseInline(text).map((seg, j) =>
    seg.kind === "bold"
      ? <Text key={j} style={{ fontWeight: "900" }}>{seg.text}</Text>
      : seg.text
  );

/**
 * Render parsed markdown tokens at a given scale. All size-
 * dependent values are inline (need `s`); static layout lives in
 * `contentStyles` below.
 */
function renderReader(text: string, accentColor: string, s: number) {
  return renderMarkdownWith(text, {
    mainTitle: (token, i) => (
      <View
        key={i}
        style={[
          contentStyles.mainTitleChip,
          {
            borderRadius: BASE.mainRadius * s,
            paddingHorizontal: BASE.mainPadH * s,
            paddingVertical: BASE.mainPadV * s,
            backgroundColor: accentColor + "33",
            borderColor: accentColor + "88",
          },
        ]}
      >
        <Text
          style={[
            contentStyles.mainTitleText,
            { fontSize: BASE.mainTitle * s, lineHeight: BASE.mainTitleLine * s, color: accentColor },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.5}
        >
          {token.text}
        </Text>
      </View>
    ),
    subTitle: (token, i) => (
      <View
        key={i}
        style={[
          contentStyles.subTitleBar,
          {
            backgroundColor: accentColor + "22",
            borderTopColor: accentColor + "66",
            borderBottomColor: accentColor + "66",
            paddingHorizontal: BASE.subPadH * s,
            paddingVertical: BASE.subPadV * s,
          },
        ]}
      >
        <Text
          style={[
            contentStyles.subTitleText,
            { fontSize: BASE.subTitle * s, lineHeight: BASE.subTitleLine * s, color: accentColor },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.5}
        >
          {token.text}
        </Text>
      </View>
    ),
    bullet: (token, i) => (
      <View key={i} style={[contentStyles.bulletRow, { gap: BASE.bulletGap * s }]}>
        <Text style={{ fontSize: BASE.body * s, lineHeight: BASE.bodyLine * s, color: accentColor }}>•</Text>
        <Text
          style={[
            contentStyles.bulletText,
            { fontSize: BASE.body * s, lineHeight: BASE.bodyLine * s },
          ]}
        >
          {renderInline(token.text)}
        </Text>
      </View>
    ),
    paragraph: (token, i) => (
      <Text
        key={i}
        style={[
          contentStyles.paragraph,
          { fontSize: BASE.body * s, lineHeight: BASE.bodyLine * s },
        ]}
      >
        {renderInline(token.text)}
      </Text>
    ),
  });
}

export function MessageReaderModal({ visible, messages, accentColor = colors.primary, onClose }: Props) {
  const insets = useSafeAreaInsets();

  // Auto-fit state. fontScale is the live scale; ready flips on once we've settled.
  const [fontScale, setFontScale] = useState(1);
  const [ready, setReady] = useState(false);
  const [containerH, setContainerH] = useState(0);
  const [contentH, setContentH] = useState(0);
  const iterationsRef = useRef(0);
  const fontScaleRef = useRef(1);
  fontScaleRef.current = fontScale;

  const messagesKey = messages.map((m) => `${m.role}:${m.text}`).join("|");
  const pinnedWarning = messages.find((m) => m.role === "ai" && !!m.warningText)?.warningText;
  const isPair = messages.length > 1;
  const isSingle = messages.length === 1;

  // Reset auto-fit each time the modal opens or the message changes.
  useEffect(() => {
    if (visible) {
      setFontScale(1);
      setReady(false);
      setContentH(0);
      iterationsRef.current = 0;
    }
  }, [visible, messagesKey]);

  /**
   * Auto-fit loop. Adjusts fontScale until the rendered content
   * fills ~90-103% of the container height, or we hit the iteration
   * cap, or movement gets too small to bother. Once `ready` flips
   * on the scale is locked in.
   */
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

  const onContainerLayout = (e: LayoutChangeEvent) => setContainerH(e.nativeEvent.layout.height);
  /**
   * ScrollView feeds us the content height via onContentSizeChange;
   * we keep taking measurements while the auto-fit loop is still
   * settling. Once `ready` is true the height is locked in and any
   * further size change just governs whether scrolling is needed.
   */
  const onScrollContentSizeChange = (_w: number, h: number) => {
    if (!ready) setContentH(h);
  };

  /**
   * When the auto-fit loop has bottomed out (typically at MIN_SCALE)
   * but the content is still taller than the viewport, fall back to
   * scrolling rather than clipping. Keeps the reader always-readable
   * regardless of message length.
   */
  const needsScroll = ready && contentH > containerH;

  // Single-message mode tints the whole background to match the bubble's role.
  const singleBgOverride =
    isSingle && { backgroundColor: messages[0].role === "ai" ? chatBubble.ai : chatBubble.user };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      transparent={false}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View style={[styles.container, { paddingTop: insets.top }, singleBgOverride]}>
        {/* Body. Hidden until the auto-fit loop has settled to avoid a flash of resize. */}
        <View style={styles.bodyWrap} onLayout={onContainerLayout}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
              styles.content,
              { opacity: ready ? 1 : 0, gap: BASE.blockGap * fontScale },
            ]}
            onContentSizeChange={onScrollContentSizeChange}
            scrollEnabled={needsScroll}
            showsVerticalScrollIndicator={needsScroll}
          >
            {messages.map((m, idx) => (
              <MessageBlock
                key={idx}
                message={m}
                accentColor={accentColor}
                scale={fontScale}
                wrapInBubble={isPair}
                showLabel={isPair}
              />
            ))}
          </ScrollView>
        </View>

        {/* Pinned warning banner. Survives across paired exchanges, not just inline with one bubble. */}
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

// One scaled message block. Pair view wraps each in its own bubble; single view skips the wrap.

interface MessageBlockProps {
  message: ReaderMessage;
  accentColor: string;
  scale: number;
  wrapInBubble: boolean;  // True in paired exchanges so each side gets its own card.
  showLabel: boolean;     // True in paired exchanges; the role label is redundant for a single bubble.
}

function MessageBlock({ message, accentColor, scale, wrapInBubble, showLabel }: MessageBlockProps) {
  const bubbleBg = message.role === "ai" ? chatBubble.ai : chatBubble.user;
  const labelColor = message.role === "ai" ? accentColor : colors.textMuted;

  return (
    <View
      style={[
        { gap: BASE.gap * scale },
        wrapInBubble && {
          backgroundColor: bubbleBg,
          borderRadius: BASE.bubbleRadius * scale,
          padding: BASE.bubblePad * scale,
        },
      ]}
    >
      {showLabel && (
        <Text
          style={[
            styles.roleLabel,
            { fontSize: BASE.roleLabel * scale, lineHeight: BASE.roleLabelLine * scale, color: labelColor },
          ]}
        >
          {message.label}
        </Text>
      )}
      <View style={{ gap: BASE.gap * scale }}>
        {renderReader(message.text, accentColor, scale)}
      </View>
    </View>
  );
}

// Static layout for tokens. Anything that depends on the live scale stays inline in renderReader.
const contentStyles = StyleSheet.create({
  mainTitleChip: {
    alignSelf: "stretch",
    borderWidth: 2,
    alignItems: "center",
  },
  mainTitleText: {
    fontWeight: "800",
    textAlign: "center",
  },
  subTitleBar: {
    alignSelf: "stretch",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    alignItems: "center",
  },
  subTitleText: {
    fontWeight: "700",
    textAlign: "center",
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  bulletText: {
    flex: 1,
    color: colors.text,
    fontWeight: "500",
  },
  paragraph: {
    color: colors.text,
    fontWeight: "500",
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  bodyWrap: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "flex-start",
    overflow: "hidden",
  },
  scroll: {
    flex: 1,
  },
  content: {
    width: "100%",
  },
  roleLabel: {
    fontWeight: "800",
    letterSpacing: 0.5,
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
    backgroundColor: warningColors.translucentBg,
    borderWidth: 2,
    borderColor: warningColors.border,
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
    color: warningColors.text,
    fontWeight: "600",
  },
});
