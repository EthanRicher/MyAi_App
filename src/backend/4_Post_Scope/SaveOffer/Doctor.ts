import { SaveOfferTypeConfig } from "./_Shared";

export const doctorSaveOffer: SaveOfferTypeConfig = {
  noun: "a plain-English explanation of what the doctor said",
  offerCriteria: `
- A complete plain-English explanation of a medical conversation the user described or recorded.
- A structured rewrite covering: what the doctor said, what it means for the user, and any next steps mentioned.`,
  doNotOffer: `
- A clarifying question back to the user (e.g. "Do you remember what they said about the dose?").
- A partial answer that only covers one piece of the conversation.
- General health chat with no specific doctor visit referenced.`,
  examples: `
- Title: "GP visit — knee pain explained" — Offer: "Would you like to save this explanation, or ask anything else first?"
- Title: "Specialist appointment — what they said" — Offer: "Should I save this for later, or do you want to keep going?"`,
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
