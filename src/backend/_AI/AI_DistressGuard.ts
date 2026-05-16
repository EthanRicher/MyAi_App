import { debugLog } from "./AI_Debug";

/**
 * Hard-coded distress backstop. Scans the user's message BEFORE the
 * AI is called so a person in crisis can't be missed by a model
 * mis-classification, a content filter, or a jailbroken prompt.
 *
 * Two tiers, matching the AMBER / RED system described in BASE_RULES:
 *
 * - RED: active intent or harm in progress. A match SHORT-CIRCUITS
 *   the AI call entirely and returns the canned RED_RESPONSE. The
 *   model is never asked.
 *
 * - AMBER: soft distress / passive ideation. A match lets the AI
 *   reply but forces it onto the AMBER template by prepending
 *   AMBER_INSTRUCTION to the user message.
 *
 * Phrase lists are deliberately conservative — false positives are
 * acceptable, false negatives are not. They can grow over time as we
 * see new ways users express distress in transcripts.
 *
 * Matching is substring-based on a normalised lowercase form with
 * apostrophes stripped, so "I've taken pills", "ive taken pills" and
 * "i've taken pills." all match the same phrase entry.
 *
 * RELATED LIST — there's a separate keyword library for visual
 * highlighting in src/config/Config_Keywords.ts (`RED_FLAG_KEYWORDS`).
 * That one paints matched words as red pills in the user bubble.
 * This one drives runtime short-circuit / instruction injection.
 * They overlap intentionally — keep both in mind when adding entries.
 */

/**
 * The two distress tiers used everywhere: the AMBER/RED chip + left
 * strip stamped onto the USER bubble that triggered the tier, the
 * field on ProcessResult, the parsed result of the AI's tier tag,
 * and the runtime check below. Exported as a named type so adding a
 * third tier later (e.g. "green") is a one-line change instead of
 * finding inline string literals across the codebase.
 */
export type DistressTier = "red" | "amber";

export type DistressCheck = {
  tier: DistressTier | null;
};

// Active-crisis phrases. A match returns the canned RED response and
// the AI is never called.
const RED_PHRASES = [
  "kill myself",
  "kill my self",
  "end my life",
  "end it tonight",
  "end it all tonight",
  "end it all",
  "off myself",
  "off my self",
  "going to do it tonight",
  "gonna do it tonight",
  "im going to do it",
  "im gonna do it",
  "ive taken pills",
  "i have taken pills",
  "took pills to die",
  "want to die",
  "wanna die",
  "going to kill someone",
  "going to hurt someone",
  "no reason to live",
  "nothing left to live for",
  "im going to end it",
  "im gonna end it",
];

// Soft-distress phrases. A match still calls the AI but forces it
// onto the AMBER template via injected instruction.
const AMBER_PHRASES = [
  "im scared",
  "i feel scared",
  "feel like hurting myself",
  "want to hurt myself",
  "thinking of hurting myself",
  "thoughts of hurting myself",
  "cant go on",
  "cannot go on",
  "whats the point",
  "no one would notice",
  "no one would care",
  "i feel so alone",
  "im so alone",
  "i cant cope",
  "i cant take any more",
  "i cant take it any more",
  "i cant do this anymore",
  "i feel hopeless",
  "im hopeless",
  "i feel worthless",
  "im worthless",
  "i feel empty",
  "i give up",
  "i want to give up",
];

// Canned RED reply. Used directly as the AI message when a RED phrase
// fires. Should be a complete, standalone response.
export const RED_RESPONSE =
  "I'm really worried about what you've just told me. Please reach out RIGHT NOW — call your local emergency number, or a crisis support line straight away.\n\n" +
  "If you can't make a call, is there someone close to you — a family member, neighbour, anyone — you can go to right now? Please don't be alone with this.";

// Forced instruction prepended to the user's text when AMBER fires.
// Wrapped in a marker so the model treats it as a system note, not
// user content.
export const AMBER_INSTRUCTION =
  "[DISTRESS GUARD — AMBER tier tripped. The user's message contains a soft-distress signal. Respond using the AMBER template from your system rules: lead with warm acknowledgement, point them to their GP and a 24/7 crisis line, and ask who they could reach out to today. Do NOT use formal refusal phrasing.]";

// Normalise: lowercase, strip apostrophes, drop other punctuation,
// collapse whitespace. Keeps the phrase lists tight and tolerant of
// "I've" / "ive" / "I ve" style variants.
const normalise = (text: string) =>
  text
    .toLowerCase()
    .replace(/['`‘’]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const findMatch = (normalisedText: string, phrases: string[]) => {
  for (const phrase of phrases) {
    if (normalisedText.includes(phrase)) {
      return phrase;
    }
  }
  return null;
};

/**
 * Hidden tier tag the model emits at the end of every reply (see the
 * TIER TAG rule in BASE_RULES). The first match supplies the AI's
 * own judgement of which tier it used; we then strip every
 * occurrence — with adjacent whitespace — so the user never sees the
 * marker.
 */
const TIER_TAG_REGEX = /\[\[TIER:(none|amber|red)\]\]/i;
const TIER_TAG_STRIP_REGEX = /\s*\[\[TIER:(?:none|amber|red)\]\]\s*/gi;

export type ParsedAiTier = {
  tier: DistressTier | undefined;
  cleanText: string;
};

export function parseTierTag(aiText: string): ParsedAiTier {
  const match = aiText.match(TIER_TAG_REGEX);
  // Replace the tag (with adjacent whitespace) with a single space so
  // a mid-text occurrence doesn't fuse the surrounding words. trim()
  // cleans up the common end-of-text case. Line breaks elsewhere in
  // the reply are left alone.
  const cleanText = aiText.replace(TIER_TAG_STRIP_REGEX, " ").trim();
  if (!match) {
    return { tier: undefined, cleanText };
  }
  const raw = match[1].toLowerCase();
  const tier = raw === "amber" || raw === "red" ? raw : undefined;
  return { tier, cleanText };
}

// Run the guard. RED takes precedence over AMBER when both match.
export const checkDistress = (rawText: string): DistressCheck => {
  if (!rawText) {
    return { tier: null };
  }

  const text = normalise(rawText);
  if (!text) {
    return { tier: null };
  }

  const red = findMatch(text, RED_PHRASES);
  if (red) {
    debugLog("DistressGuard", "RED", "Triggered", { phrase: red });
    return { tier: "red" };
  }

  const amber = findMatch(text, AMBER_PHRASES);
  if (amber) {
    debugLog("DistressGuard", "AMBER", "Triggered", { phrase: amber });
    return { tier: "amber" };
  }

  return { tier: null };
};
