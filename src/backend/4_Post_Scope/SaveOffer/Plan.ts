import { SaveOfferTypeConfig } from "./_Shared";

// Save-offer rules for the "plan" category. Bias toward offering early — even short plans are worth keeping.
export const planSaveOffer: SaveOfferTypeConfig = {
  noun: "a daily plan",
  offerCriteria: `
- ANY plan with 2 or more concrete steps or time slots the user has agreed to.
- A partial day-plan (morning only, afternoon only) that still has 2+ ordered items.
- A revised plan after the user tweaked an earlier draft (offer again so they can save the latest version).`,
  doNotOffer: `
- Only one vague intent on its own ("I'll go for a walk later") with no surrounding plan.
- The AI is still presenting options and the user hasn't picked any yet.
- Pure clarifying questions back to the user with no plan items on the page.`,
  examples: `
- Title: "Tuesday plan with Sarah's visit" — Offer: "Want me to save this plan now, or shall we adjust it first?"
- Title: "Morning routine" — Offer: "Happy to save this plan, or keep adding to it?"`,
  structureGuidance: `
- First line: a short heading naming the plan, e.g. "Plan for today" or "Tuesday plan".
- Then a blank line.
- Then "- " bullet lines, ONE activity per bullet, in time order if times are mentioned (e.g. "- 9:00am — Go for a walk", "- 11:00am — Tea with Margaret").
- Each bullet ~6–12 words. No filler, no greetings, no follow-up question, no save offer.
- Do NOT include any of the AI's chat-style commentary ("Here's a plan for you...") — just the heading and bullets.`,
};
