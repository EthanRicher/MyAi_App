import { SaveOfferTypeConfig } from "./_Shared";

export const memorySaveOffer: SaveOfferTypeConfig = {
  noun: "a memory record",
  offerCriteria: `
- A complete written-up memory with setting, people, and the moment the user wants to remember.
- A short story-style recollection (a few sentences) that captures one specific event clearly.`,
  doNotOffer: `
- A passing reference to the past inside general chat.
- A single sentence with no scene or detail ("I remember Sundays").
- A prompt asking the user "what do you remember?" without their answer.`,
  examples: `
- Title: "The day Dad taught me to fish" — Offer: "Want me to save this memory, or add more detail first?"
- Title: "Wedding day at St. Mary's, 1968" — Offer: "Should I save this memory, or keep going?"`,
  structureGuidance: `
- First line: a short intro sentence naming the memory (e.g. "Wedding day at St. Mary's, 1968.").
- Then a blank line.
- Then "- " bullet lines covering: who was there, where, when, sensory details (sights, smells, sounds), what was said, how it felt.
- 4–8 bullets max. No greetings, no chat-style commentary, no follow-up question, no save offer.`,
};
