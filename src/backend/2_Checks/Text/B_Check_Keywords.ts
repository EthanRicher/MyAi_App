import { RED_FLAG_KEYWORDS } from "../../../config/Config_Keywords";

/**
 * Hardcoded keyword scanner. The deterministic safety layer. Splits
 * a string into runs and marks any matched red-flag keyword or
 * phrase so the chat can paint it as a red pill in the user bubble.
 * Fast, predictable, and runs in parallel with the AI second-pass.
 *
 * Apostrophe handling: the scanner folds smart quotes (U+2018/19
 * `'` `'`, plus backtick `` ` ``) to a plain ASCII apostrophe before
 * matching, on both the input text AND the keyword list. Phone
 * keyboards auto-correct "can't" into "can't" (smart apostrophe) and
 * the literal regex would otherwise miss it.
 */

export type KeywordSegment = { kind: "text" | "flag"; text: string };

// Fold the various apostrophe codepoints to a single ASCII one. Keeps
// the keyword list and user input in the same shape for matching.
const foldApostrophes = (s: string) => s.replace(/[‘’ʼ`]/g, "'");

// Escape regex specials so keyword strings can be slotted straight into the alternation.
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Sort longest first so multi-word phrases beat shorter substrings
 * (e.g. "chest pain" wins over a hypothetical "pain" entry).
 */
const KEYWORD_RE = new RegExp(
  `\\b(${[...RED_FLAG_KEYWORDS]
    .map((k) => foldApostrophes(k))
    .sort((a, b) => b.length - a.length)
    .map(escape)
    .join("|")})\\b`,
  "gi"
);

/**
 * Splits a string into runs, marking any matched red-flag keyword
 * or phrase so a renderer can highlight it. Returns an empty array
 * for empty input.
 *
 * The fold-then-match approach scans against the normalised text,
 * but the emitted `text` slices come from the ORIGINAL input so the
 * UI renders the user's actual characters (smart quotes preserved).
 */
export function scanKeywords(text: string): KeywordSegment[] {
  if (!text) return [];
  const normalised = foldApostrophes(text);
  const segments: KeywordSegment[] = [];
  let lastIndex = 0;
  for (const m of normalised.matchAll(KEYWORD_RE)) {
    if (m.index! > lastIndex) {
      segments.push({ kind: "text", text: text.slice(lastIndex, m.index) });
    }
    // Re-slice from the original input so the displayed bubble keeps
    // the user's smart quotes / backticks — the indices line up
    // because the fold is a per-character substitution.
    segments.push({ kind: "flag", text: text.slice(m.index!, m.index! + m[0].length) });
    lastIndex = m.index! + m[0].length;
  }
  if (lastIndex < text.length) {
    segments.push({ kind: "text", text: text.slice(lastIndex) });
  }
  return segments;
}
