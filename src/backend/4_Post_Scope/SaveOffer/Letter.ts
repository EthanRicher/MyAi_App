import { SaveOfferTypeConfig } from "./_Shared";

export const letterSaveOffer: SaveOfferTypeConfig = {
  noun: "a letter",
  offerCriteria: `
- A complete or near-complete letter draft: greeting, body paragraphs, and a sign-off all present.
- A short note-style letter that has clear opening, message, and closing — even if brief.`,
  doNotOffer: `
- Drafts missing the body OR the sign-off (still a work in progress).
- The user is still deciding the recipient, tone, or topic.`,
  examples: `
- Title: "Letter to Auntie Mary about the wedding" — Offer: "Would you like to save this letter, or keep editing it?"
- Title: "Thank-you note for Dr. Patel" — Offer: "Should I save this letter, or do you want to tweak it more?"`,
  structureGuidance: `
- Keep the LETTER text exactly as drafted: greeting, body, sign-off. Don't rewrite the prose.
- Strip any chat-style preamble ("Here's a draft for you..."), any trailing follow-up question, and any save offer.
- Preserve paragraph breaks as the user would see them on paper.`,
};
