import { SaveOfferTypeConfig } from "./_Shared";

// Save-offer rules for the "summary" category. Bias toward offering early — partial summaries are still useful references.
export const summarySaveOffer: SaveOfferTypeConfig = {
  noun: "a document summary",
  offerCriteria: `
- ANY plain-English summary or paraphrase of a document the user shared (letter, bill, medical paperwork, etc.).
- A partial summary that covers the main thrust, even if not every section is fleshed out.
- A revised summary after the user asked for changes (offer again so they can save the latest version).`,
  doNotOffer: `
- Pure clarifying questions back to the user with no summary content yet on the page.
- General chat with no document reference at all.`,
  examples: `
- Title: "Hospital discharge summary — plain English" — Offer: "Want me to save this summary, or keep going with more questions?"
- Title: "Electricity bill explained" — Offer: "Happy to save this now, or shall we dig in more first?"`,
  structureGuidance: `
- First line: a short heading naming the document (e.g. "Hospital discharge summary").
- Then a blank line.
- Then a "Key points" section header on its own line, followed by "- " bullets covering the main facts.
- Then a blank line.
- Then a "What to do" section header (only if any actions are implied), followed by "- " bullets.
- No greetings, no chat-style commentary, no follow-up question, no save offer.`,
};
