import { SaveOfferTypeConfig } from "./_Shared";

export const planSaveOffer: SaveOfferTypeConfig = {
  noun: "a daily plan",
  offerCriteria: `
- A finished plan with concrete time slots or ordered steps the user could follow.
- A schedule for a day or part of a day with at least 3 actionable items.`,
  doNotOffer: `
- A vague intent ("I'll go for a walk later") without structure.
- One-off reminders that are not part of a broader plan.
- Suggestions still being narrowed down (e.g. "or maybe...").`,
  examples: `
- Title: "Tuesday plan with Sarah's visit" — Offer: "Want me to save this plan, or do you want to adjust it first?"
- Title: "Morning routine" — Offer: "Should I save this plan, or keep tweaking it?"`,
  structureGuidance: `
- First line: a short heading naming the plan, e.g. "Plan for today" or "Tuesday plan".
- Then a blank line.
- Then "- " bullet lines, ONE activity per bullet, in time order if times are mentioned (e.g. "- 9:00am — Go for a walk", "- 11:00am — Tea with Margaret").
- Each bullet ~6–12 words. No filler, no greetings, no follow-up question, no save offer.
- Do NOT include any of the AI's chat-style commentary ("Here's a plan for you...") — just the heading and bullets.`,
};
