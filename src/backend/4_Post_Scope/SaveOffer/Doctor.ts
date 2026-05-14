import { SaveOfferTypeConfig } from "./_Shared";

// Save-offer rules for the "doctor" category. Bias toward offering early — even a partial breakdown is useful to keep.
export const doctorSaveOffer: SaveOfferTypeConfig = {
  noun: "a plain-English explanation of what the doctor said",
  offerCriteria: `
- ANY plain-English breakdown of a medical conversation the user described, even if only one section has real content (just "what the doctor said", or just "next steps").
- A partial answer that explains a piece of what the doctor said clearly — they can refine and re-save later.
- A revised explanation after the user added more detail about the visit (offer again so they can save the latest version).`,
  doNotOffer: `
- Pure clarifying questions back to the user with no explanation content on the page yet.
- General health chat with no specific doctor visit referenced at all.`,
  examples: `
- Title: "GP visit — knee pain explained" — Offer: "Want me to save this for later, or shall we add more detail first?"
- Title: "Specialist appointment — what they said" — Offer: "Happy to save this now, or keep going?"`,
  structureGuidance: `
- First line: a short heading naming the visit (e.g. "GP appointment — knee pain").
- Then a blank line.
- Then a "What the doctor said" section header on its own line, followed by "- " bullets in plain English.
- Then a blank line.
- Then a "What it means for me" section header, followed by "- " bullets in first person.
- Then a blank line.
- Then a "Next steps" section header (only if any are mentioned), followed by "- " bullets.
- No greetings, no chat-style commentary, no follow-up question, no save offer.`,
};
