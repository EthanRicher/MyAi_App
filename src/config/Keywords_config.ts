// ─── Red-Flag Keyword Library ─────────────────────────────────────────────────
// Words and phrases that should be surfaced visually inside user messages so a
// carer can spot urgent phrasing at a glance. The scanner is case-insensitive
// and whole-word; phrases with spaces are matched as exact runs. Add or remove
// entries here — the regex is rebuilt automatically.

export const RED_FLAG_KEYWORDS: string[] = [
  // Acute / emergency
  "emergency",
  "chest pain",
  "trouble breathing",
  "can't breathe",
  "cannot breathe",
  "shortness of breath",
  "severe pain",
  "passed out",
  "passing out",
  "unconscious",
  "stroke",
  "heart attack",
  "allergic reaction",
  "anaphylaxis",
  "bleeding",

  // Mental health
  "suicidal",
  "suicide",
  "self harm",
  "self-harm",
  "kill myself",
  "end my life",
  "want to die",

  // Medication safety
  "overdose",
  "took too much",
  "double dose",
  "dosage",
  "medication",

  // Open-ended urgency
  "what should I do",
  "i need help",
  "help me",
  "scared",
];

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
