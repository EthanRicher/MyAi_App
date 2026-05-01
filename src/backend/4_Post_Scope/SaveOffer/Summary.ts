import { SaveOfferTypeConfig } from "./_Shared";

export const summarySaveOffer: SaveOfferTypeConfig = {
  noun: "a document summary",
  offerCriteria: `
- A finished plain-English summary of a document the user shared (letter, bill, medical paperwork, etc.).
- A structured rewrite (key points, what it means, what to do) of the original text.`,
  doNotOffer: `
- A clarifying question back to the user.
- A partial paraphrase that hasn't covered the whole document.
- General chat with no document reference.`,
  examples: `
- Title: "Hospital discharge summary — plain English" — Offer: "Would you like to save this summary, or ask anything else first?"
- Title: "Electricity bill explained" — Offer: "Should I save this summary, or do you have more questions?"`,
  structureGuidance: `
- First line: a short heading naming the document (e.g. "Hospital discharge summary").
- Then a blank line.
- Then a "Key points" section header on its own line, followed by "- " bullets covering the main facts.
- Then a blank line.
- Then a "What to do" section header (only if any actions are implied), followed by "- " bullets.
- No greetings, no chat-style commentary, no follow-up question, no save offer.`,
};
