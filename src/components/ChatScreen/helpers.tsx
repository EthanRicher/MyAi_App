import { Text, View } from "react-native";
import { renderMarkdownWith, parseInline } from "../../backend/6_Present/Present_Markdown";
import { AI_WARNING } from "../../backend/3_Scopes/_Common/Scope_Common_Warnings";
import { styles } from "./styles";

/**
 * Small helpers the chat leans on but that don't belong in the main
 * component. The markdown to JSX wrappers, the rule for when an AI
 * reply earns a warning banner, a quick "is this a structured
 * breakdown" check, and a tiny timestamp helper.
 */

// Inline markdown. Handles bold spans inside paragraphs and bullets.
export const renderInline = (text: string) =>
  parseInline(text).map((seg, j) =>
    seg.kind === "bold"
      ? <Text key={j} style={{ fontWeight: "700" }}>{seg.text}</Text>
      : seg.text
  );

/**
 * Block-level markdown for AI replies. Maps each token (main title,
 * sub-title, bullet, paragraph) to its own little component so the
 * bubble looks structured rather than a wall of text. The accent
 * colour lets each chat tint its own headings.
 */
export function renderMessageContent(text: string, accentColor: string, baseStyle: object) {
  return renderMarkdownWith(text, {
    mainTitle: (token, i) => (
      <View key={i} style={[styles.mainTitleChip, { backgroundColor: accentColor + "33", borderColor: accentColor + "88" }]}>
        <Text
          style={[styles.mainTitleText, { color: accentColor }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.5}
        >
          {token.text}
        </Text>
      </View>
    ),
    subTitle: (token, i) => (
      <View key={i} style={[styles.subTitleChip, { borderColor: accentColor + "55" }]}>
        <Text
          style={[styles.subTitleText, { color: accentColor }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.5}
        >
          {token.text}
        </Text>
      </View>
    ),
    bullet: (token, i) => (
      <View key={i} style={styles.bulletRow}>
        <Text style={[baseStyle, { color: accentColor }]}>{"•"}</Text>
        <Text style={[baseStyle, styles.bulletText]}>{renderInline(token.text)}</Text>
      </View>
    ),
    paragraph: (token, i) => (
      <Text key={i} style={baseStyle}>{renderInline(token.text)}</Text>
    ),
  });
}

/**
 * Decide whether an AI reply deserves a warning banner. Short casual
 * lines and apologies are skipped so we don't paste a disclaimer onto
 * every "Sorry, I didn't catch that". Anything longer or formatted
 * gets the banner.
 */
export const resolveWarning = (text: string, scopeWarning?: string): string | undefined => {
  const t = text.trimStart().toLowerCase();
  if (t.startsWith("sorry") || t.startsWith("i couldn't") || t.startsWith("i'm sorry")) return undefined;
  const hasStructure = text.includes("**") || text.includes("- ");
  const wordCount = text.trim().split(/\s+/).length;
  if (!hasStructure && wordCount < 40) return undefined;
  return scopeWarning ?? AI_WARNING;
};

// Short HH:MM time stamp for each bubble.
export const now = () => {
  const d = new Date();
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

// Does this reply look like a structured breakdown (bold headings or bullets).
export const isBreakdown = (t: string | undefined) =>
  !!t && (/\*\*[^*]+\*\*/.test(t) || /^[-•*]\s+/m.test(t));
