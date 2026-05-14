import { SaveOfferTypeConfig } from "./_Shared";

// Save-offer rules for the "appointment" category. Bias toward offering early — partial checklists are still useful prep.
export const appointmentSaveOffer: SaveOfferTypeConfig = {
  noun: "an appointment prep checklist",
  offerCriteria: `
- ANY appointment prep checklist with at least one filled section (questions to ask, things to bring, symptoms / history to mention, medications to list).
- A partial list (just "Questions to ask" with 2+ bullets, for example) — it's still useful prep, and the user can refine and re-save later.
- A revised checklist after the user added more (offer again so they can save the latest version).`,
  doNotOffer: `
- Pure clarifying questions back to the user with no checklist items on the page yet ("What's the appointment for?").
- A single passing tip with no surrounding structure.`,
  examples: `
- Title: "GP appointment — knee pain prep" — Offer: "Want me to save this checklist now, or shall we add more first?"
- Title: "Cardiologist visit — questions and history" — Offer: "Happy to save this prep list, or keep adding?"`,
  structureGuidance: `
- First line: a short heading naming the appointment (e.g. "GP appointment — knee pain prep" or "Cardiologist visit").
- Then a blank line.
- Then a "Questions to ask" section header on its own line, followed by "- " bullets, one question per bullet.
- Then a blank line.
- Then a "Bring with you" section header, followed by "- " bullets (e.g. medication list, recent test results, ID, support person).
- Then a blank line.
- Then a "Symptoms / history to mention" section header, followed by "- " bullets in first person ("I have been feeling...").
- Sections that don't apply can be omitted, but if used keep the order above.
- No greetings, no chat-style commentary, no follow-up question, no save offer.`,
};
