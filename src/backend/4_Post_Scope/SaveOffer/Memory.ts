import { SaveOfferTypeConfig } from "./_Shared";
import { MEMORY_CONTEXT_HEADING } from "../../3_Scopes/Companion/Chat_CompanionBase";

/**
 * Save-offer rules for the "memory" category. PASSIVE save: the
 * Memory Book scope deliberately replies conversationally and is
 * told NOT to dump structured write-ups, so the judge cannot rely on
 * the AI reply for facts. Instead it reads the user's message,
 * conversation history, and the EXISTING MEMORIES context block
 * (all already inside `userMessage`) to build / refine the record.
 */
export const memorySaveOffer: SaveOfferTypeConfig = {
  noun: "a memory record",
  offerCriteria: `
- The user's recent message(s) describe ANY past moment, event, or recollection of their own — even briefly.
- ANY snippet counts: when, where, who was there, what happened, what was said, a sensory detail, how it felt, a small aside ("Dad always wore his old jumper"). Memory Book saves SILENTLY in the background and accumulates snippets over time. NEVER hold out for a "complete" write-up.
- The USER'S LAST MESSAGE block may include an "${MEMORY_CONTEXT_HEADING}" section listing previously saved memories. Match the current message against those entries by the moment they describe (the same event / day / scene). If matched, treat the new snippet as an UPDATE and reuse the existing title verbatim so the doc upserts in place.`,
  doNotOffer: `
- The user's message is general chat or a question with no recollection of their own.
- The user only asked the AI something without sharing a memory this turn.
- The latest turn adds nothing beyond what's already captured in the EXISTING MEMORIES section.
- A vague reference to the past with no anchor in time, place, person, or what happened ("I remember Sundays" alone).`,
  examples: `
- Title: "The day Dad taught me to fish" — Offer: "Saving this memory in the background."
- Title: "Wedding day at St. Mary's, 1968" — Offer: "Saving this memory in the background."`,
  structureGuidance: `
- IMPORTANT: build the cleanContent from what the USER has actually shared — across the conversation history, the EXISTING MEMORIES section (when present), and the latest message. The AI reply is conversational by design; do NOT mine it for facts.
- First line: a short intro sentence naming the memory (e.g. "Wedding day at St. Mary's, 1968.").
- Then a blank line.
- Then "- " bullet lines covering: who was there, where, when, sensory details (sights, smells, sounds), what was said, how it felt. ONE detail per bullet, ~6–12 words each.
- MERGE rule: if you matched an EXISTING MEMORIES entry, INCLUDE every existing bullet from that entry verbatim, then APPEND new bullets for the snippet(s) from this turn. Never drop or rewrite existing bullets. Never lose detail across upserts.
- For suggestedTitle: REUSE the matched existing entry's title VERBATIM if found (case, dashes, everything — so the doc upserts cleanly). If new, pick a short evocative title for the moment.
- No greetings, no chat-style commentary, no follow-up question, no save offer in cleanContent.`,
};
