import { SaveOfferTypeConfig } from "./_Shared";

export const appointmentSaveOffer: SaveOfferTypeConfig = {
  noun: "an appointment prep checklist",
  offerCriteria: `
- A complete prep list for an upcoming appointment: questions to ask, things to bring, symptoms or history to mention, medications to list.
- A structured checklist with clear groups (e.g. "Questions", "Bring with you", "Symptoms to mention").`,
  doNotOffer: `
- A clarifying question back to the user ("What's the appointment for?").
- A vague suggestion that hasn't been turned into a list ("Make sure you ask about the results").
- A single tip without surrounding context.`,
  examples: `
- Title: "GP appointment — knee pain prep" — Offer: "Would you like to save this checklist, or add anything else first?"
- Title: "Cardiologist visit — questions and history" — Offer: "Should I save this prep list, or do you want to keep going?"`,
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
