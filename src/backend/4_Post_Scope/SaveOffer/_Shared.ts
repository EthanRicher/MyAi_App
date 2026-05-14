/**
 * Shared scaffolding for the per-doc-type save-offer judges. Each
 * category file under SaveOffer/ exports a SaveOfferTypeConfig
 * describing what counts as save-worthy for that category and
 * example titles / offers. The router (Post_SaveOffer.ts) injects
 * these into a common prompt frame.
 */

// What runSaveOfferPost returns for a single AI turn.
export type SaveOfferResult = {
  shouldOffer: boolean;     // True when the reply is worth saving.
  suggestedTitle?: string;  // Pre-fill for the save modal.
  offerSentence?: string;   // One-sentence offer shown in the chat ("Want me to save this, or...").
  cleanContent?: string;    // The reply rewritten in the storage shape.
};

// Per-category config that customises the shared prompt frame.
export type SaveOfferTypeConfig = {
  /** Short label used in the prompt to refer to this doc type ("a letter", "a plan"). */
  noun: string;
  /** Bullet list (markdown-style) describing what counts as save-worthy. */
  offerCriteria: string;
  /** Bullet list of explicit "do not offer" cases for this type. */
  doNotOffer: string;
  /** Two example title + offer pairs to anchor the model. */
  examples: string;
  /** How to rewrite the AI reply for storage — title line + bullets, etc. */
  structureGuidance: string;
};

// Shared rules + JSON shape appended to every per-type prompt.
const SHARED_TAIL = `
DEFAULT TO OFFERING SAVE when in doubt. The user can always decline or keep
editing — a missed offer is worse than an extra one. Offer as soon as the AI
reply contains an artefact that would be useful to re-read later, even if it
isn't "finished" yet. Save now does NOT lock anything in: the user can keep
chatting after saving, and later versions can be saved on top via title
match.

DO NOT OFFER SAVE for:
- Greetings, small talk, or generic chat with no artefact at all
- Pure clarifying questions back to the user with no draft content yet
- A reply that is only an option-list still waiting on the user to choose
- Single-sentence emotional support replies with no artefact attached

If you decide to offer save, write a warm one-sentence offer that frames TWO
options (save now OR keep going) — never imply saving is the only path.

If shouldOffer is true, ALSO produce a "cleanContent" — the storage record
built per the structureGuidance above. Some doc types want the AI reply
rewritten; others (family, memory) want a record built from the user's
messages. Follow the per-type guidance. This is what the user will see when
they open the saved doc, so it must be tidy on its own (no chat preamble,
no trailing follow-up question, no save offer).

Return ONLY valid JSON in this exact shape. Empty strings if shouldOffer is false.
{
  "shouldOffer": <boolean>,
  "suggestedTitle": "<short title, max 60 chars, no quotes>",
  "offerSentence": "<one warm sentence offering save vs continue>",
  "cleanContent": "<the rewritten doc body — see structure guidance above>"
}
`.trim();

// Stitch together the type-specific config with the shared tail and the actual conversation.
export function buildSaveOfferPrompt(
  cfg: SaveOfferTypeConfig,
  userMessage: string,
  aiReply: string
): string {
  return [
    `You are a save-offer judge for an elderly user's chat assistant.`,
    `The chat the user is in is for ${cfg.noun}.`,
    `Read the user's last message and the AI reply below, then decide whether the reply contains ${cfg.noun} worth saving as a re-readable record.`,
    ``,
    `OFFER SAVE for:`,
    cfg.offerCriteria.trim(),
    ``,
    `DO NOT OFFER SAVE for (in addition to the general rules below):`,
    cfg.doNotOffer.trim(),
    ``,
    `Examples for this doc type:`,
    cfg.examples.trim(),
    ``,
    `STORAGE SHAPE (how to format cleanContent):`,
    cfg.structureGuidance.trim(),
    ``,
    SHARED_TAIL,
    ``,
    `USER'S LAST MESSAGE:`,
    `"""`,
    userMessage.replace(/"""/g, '"'),
    `"""`,
    ``,
    `AI REPLY (judge this):`,
    `"""`,
    aiReply.replace(/"""/g, '"'),
    `"""`,
  ].join("\n");
}
