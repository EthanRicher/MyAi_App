import { DIAGNOSE_RULE } from "./Scope_Common_Diagnose";
import { DISTRESS_RULE } from "./Scope_Common_Distress";
import { TIER_TAG_RULE } from "./Scope_Common_TierTag";

/**
 * Universal safety rules every scope inherits. Composed from smaller
 * topic-specific fragments so each rule is easy to find and tweak in
 * isolation:
 *
 *   - DIAGNOSE_RULE   (Scope_Common_Diagnose.ts)
 *   - DISTRESS_RULE   (Scope_Common_Distress.ts) — GP, emergency, AMBER, RED
 *   - TIER_TAG_RULE   (Scope_Common_TierTag.ts)
 *
 * SCAN_BASE_RULES below is the lightweight alternative for one-shot
 * JSON-output scan scopes (medication scan, scam check, symptom log).
 * Relevance helpers (off-topic / off-photo deflections) also live
 * here because they're built per-scope from the topic string.
 */

const OTHER_RULES = `
OTHER RULES:
- Do NOT replace medical advice
- Do NOT make up missing info
- If unsure, say so
- Keep responses simple and clear
`.trim();

export const BASE_RULES = `
GENERAL RULES — apply to EVERY scope.

${DIAGNOSE_RULE}

${DISTRESS_RULE}

${TIER_TAG_RULE}

${OTHER_RULES}
`.trim();

/**
 * Lightweight rules for one-shot scan / extraction scopes that emit
 * structured JSON (MedView medication scan, SafeHarbour scam check,
 * SenseGuard symptom log). These are NOT chats — the user submits one
 * input and gets one structured result, then the screen ends.
 *
 * Crucially this set deliberately leaves OUT:
 * - DISTRESS ESCALATION (AMBER/RED templates) — would replace the
 *   JSON output with conversational text and corrupt the scope.
 * - TIER TAG emission — would leak [[TIER:none]] into JSON fields.
 * - GP nudge / emergency call-out — same reason: not conversational.
 * - Relevance / off-topic deflection — each scan scope handles
 *   off-topic input via its own "invalid" / "unsure" status field.
 *
 * The hardcoded distress guard in runChatTurn doesn't apply here
 * either (these scopes call runAI directly), so distress signals in
 * the input flow through to the scope's own logic. That's by design:
 * a distress phrase typed into the symptom log gets logged as not-a-
 * symptom; a scam check on a distress note returns "unsure". The
 * distress system belongs in chat surfaces, not data entry.
 */
export const SCAN_BASE_RULES = `
GENERAL RULES — one-shot extraction / scan, not a chat.

- Do NOT diagnose or speculate about what the user might have
- Only extract or analyse what is clearly present in the input
- If something is missing, unclear, or off-topic for the scan, leave
  fields empty or use the "invalid" / "unsure" status defined in the
  task — do NOT respond with conversational text
- Reply ONLY with the structured output the task asks for — no
  warnings, no disclaimers, no tier tags, no follow-up questions
- Do NOT make up missing info
`.trim();

// Off-topic guard for text input. Uses the scope's topic when one is provided.
// IMPORTANT: judges relevance in CONTEXT — a short answer to a question YOU just asked
// is always on-topic, even if the answer alone (e.g. "the Crown and Anchor", "yes",
// "Bristol") looks unrelated to the topic when read in isolation.
//
// Deflection wording is standardised across every scope so it's easy to grep
// in logs ("Sorry, I can't help with that here") and easy for the user to
// tell why the AI declined. Scopes should still describe their own IN-SCOPE
// INPUTS in the task body so bare terms / single-word inputs aren't misread
// as off-topic.
export const buildRelevanceRule = (topic?: string) =>
  topic
    ? `- Only deflect when the user CLEARLY changes the subject to something with no connection to ${topic}. Read the conversation history first: if the user is answering a question you just asked, or expanding on something you raised, that is ON-TOPIC even when the message alone (a place, a name, a "yes", a hobby) sounds unrelated. A short bare term or phrase that fits the IN-SCOPE INPUTS described in the task is ALSO on-topic — do not deflect it. NEVER deflect a message that contains a distress signal (fear, low mood, hopelessness, self-harm thoughts, suicidal language) — those override this rule and are handled by the DISTRESS ESCALATION rules in your system instructions. When in doubt, stay engaged. If you do deflect, respond with exactly: "Sorry, I can't help with that here — I'm only set up to ${topic}. Is there something along those lines I can help with?"`
    : `- If the user asks something completely unrelated to your task, politely say so and briefly remind them what you are here to help with. Don't deflect on a short answer to your own question, on a single in-scope term, or on any message that contains a distress signal.`;

// Off-photo guard. Looser than the text rule because photos are more ambiguous.
export const buildPhotoRelevanceRule = (topic?: string) =>
  topic
    ? `- Only reject the photo if it clearly shows something with NO possible connection to ${topic} — such as a selfie, a landscape, food, or a random object. If there is any doubt, try to help. If you do reject it, respond with exactly: "Sorry, I can't help with this photo here — I'm only set up to ${topic}. Try a photo that fits that."`
    : `- Only reject the photo if it is clearly and obviously unrelated to your task`;
