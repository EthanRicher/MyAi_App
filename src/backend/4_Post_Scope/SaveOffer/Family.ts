import { SaveOfferTypeConfig } from "./_Shared";

export const familySaveOffer: SaveOfferTypeConfig = {
  noun: "a family member record",
  offerCriteria: `
- A consolidated record about ONE family member with multiple facts (name, relation, plus details: birthday, hometown, hobbies, kids, anecdotes).
- A summary that brings together what the user has shared so far about that person.`,
  doNotOffer: `
- A single new fact added to a person who's still being talked about ("she likes tea" alone).
- General chat about family without a clear person being summarised.
- Mid-question clarifications.`,
  examples: `
- Title: "Margaret — my sister-in-law" — Offer: "Would you like me to save this for Margaret, or add more first?"
- Title: "Tom — grandson" — Offer: "Should I save Tom's record, or do you have more to add?"`,
  structureGuidance: `
- First line: a short intro sentence naming the person and their relation to the user (e.g. "Margaret, my sister-in-law.").
- Then a blank line.
- Then "- " bullet lines: relationship, age or birthday if known, where they live, work, hobbies, personality, notable memories or facts.
- One fact per bullet, ~6–12 words each. No greetings, no chat-style commentary, no follow-up question, no save offer.`,
};
