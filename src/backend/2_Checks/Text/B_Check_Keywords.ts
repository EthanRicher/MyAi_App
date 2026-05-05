import { RED_FLAG_KEYWORDS } from "../../../config/Config_Keywords";

/**
 * Hardcoded keyword scanner. The deterministic safety layer. Splits
 * a string into runs and marks any matched red-flag keyword or
 * phrase so the chat can paint it as a red pill in the user bubble.
 * Fast, predictable, and runs in parallel with the AI second-pass.
 */

export type KeywordSegment = { kind: "text" | "flag"; text: string };

// Escape regex specials so keyword strings can be slotted straight into the alternation.
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Sort longest first so multi-word phrases beat shorter substrings
 * (e.g. "chest pain" wins over a hypothetical "pain" entry).
 */
const KEYWORD_RE = new RegExp(
  `\\b(${[...RED_FLAG_KEYWORDS]
    .sort((a, b) => b.length - a.length)
    .map(escape)
    .join("|")})\\b`,
  "gi"
);

/**
 * Splits a string into runs, marking any matched red-flag keyword
 * or phrase so a renderer can highlight it. Returns an empty array
 * for empty input.
 */
export function scanKeywords(text: string): KeywordSegment[] {
  if (!text) return [];
  const segments: KeywordSegment[] = [];
  let lastIndex = 0;
  for (const m of text.matchAll(KEYWORD_RE)) {
    if (m.index! > lastIndex) {
      segments.push({ kind: "text", text: text.slice(lastIndex, m.index) });
    }
    segments.push({ kind: "flag", text: m[0] });
    lastIndex = m.index! + m[0].length;
  }
  if (lastIndex < text.length) {
    segments.push({ kind: "text", text: text.slice(lastIndex) });
  }
  return segments;
}
