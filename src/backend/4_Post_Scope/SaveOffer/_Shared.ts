// Shared scaffolding for the per-doc-type save-offer judges.
// Each category file under SaveOffer/ exports a SaveOfferTypeConfig describing
// what counts as save-worthy for that category and example titles/offers.
// The router (Post_SaveOffer.ts) injects these into a common prompt frame.

export type SaveOfferResult = {
  shouldOffer: boolean;
  suggestedTitle?: string;
  offerSentence?: string;
  cleanContent?: string;
};

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

const SHARED_TAIL = `
DO NOT OFFER SAVE for:
- Greetings, small talk, or generic chat
- Mid-draft brainstorms, clarifying questions, partial answers
- Single-sentence replies, expressions of feeling without an artefact
- Lists of options where the user has not yet picked one

If you decide to offer save, write a warm one-sentence offer that frames TWO
options (save now OR keep going) — never imply saving is the only path.

If shouldOffer is true, ALSO produce a "cleanContent" — the AI reply rewritten
into the storage shape described in the per-type instructions above. This is
what the user will see when they open the saved doc, so it must be tidy on
its own (no chat preamble, no trailing follow-up question, no save offer).

Return ONLY valid JSON in this exact shape. Empty strings if shouldOffer is false.
{
  "shouldOffer": <boolean>,
  "suggestedTitle": "<short title, max 60 chars, no quotes>",
  "offerSentence": "<one warm sentence offering save vs continue>",
  "cleanContent": "<the rewritten doc body — see structure guidance above>"
}
`.trim();

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
