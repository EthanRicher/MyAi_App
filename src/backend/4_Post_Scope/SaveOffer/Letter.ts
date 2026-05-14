import { SaveOfferTypeConfig } from "./_Shared";

// Save-offer rules for the "letter" category. Bias toward offering early — partial drafts are still useful to save.
export const letterSaveOffer: SaveOfferTypeConfig = {
  noun: "a letter",
  offerCriteria: `
- ANY recognisable letter draft, even partial: a greeting alone with a started body, a body without a sign-off, or a sign-off draft on its own. The user can keep refining after saving.
- A short note that reads as a letter, even just one or two paragraphs.
- A redraft / revision of a previous letter draft (offer again on each revision so the user can save the latest version).`,
  doNotOffer: `
- Only a clarifying question back to the user with no draft content at all.
- The user is purely brainstorming recipients or topics with no letter text on the page.`,
  examples: `
- Title: "Letter to Auntie Mary about the wedding" — Offer: "Want me to save this draft so far, or keep working on it?"
- Title: "Thank-you note for Dr. Patel" — Offer: "Happy to save this now, or shall we keep tweaking?"`,
  structureGuidance: `
- Keep the LETTER text exactly as drafted: greeting, body, sign-off. Don't rewrite the prose.
- Strip any chat-style preamble ("Here's a draft for you..."), any trailing follow-up question, and any save offer.
- Preserve paragraph breaks as the user would see them on paper.`,
};
