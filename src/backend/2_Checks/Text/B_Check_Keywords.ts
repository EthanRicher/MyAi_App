import { RED_FLAG_KEYWORDS } from "../../../config/Config_Keywords";

export type KeywordSegment = { kind: "text" | "flag"; text: string };

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Sort longest first so multi-word phrases beat shorter substrings
// (e.g. "chest pain" wins over a hypothetical "pain" entry).
const KEYWORD_RE = new RegExp(
  `\\b(${[...RED_FLAG_KEYWORDS]
    .sort((a, b) => b.length - a.length)
    .map(escape)
    .join("|")})\\b`,
  "gi"
);

// Splits a string into runs, marking any matched red-flag keyword/phrase
// so a renderer can highlight it. Returns an empty array for empty input.
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
