import { SaveOfferTypeConfig } from "./_Shared";
import { FAMILY_CONTEXT_HEADING } from "../../3_Scopes/Companion/Chat_CompanionBase";

/**
 * Save-offer rules for the "family" category. PASSIVE save: the
 * Family Tree scope deliberately replies conversationally and is
 * told NOT to dump structured profiles, so the judge cannot rely on
 * the AI reply for facts. Instead it reads the user's message,
 * conversation history, and the EXISTING FAMILY MEMBERS context
 * block (all already inside `userMessage`) to build / refine the
 * record.
 */
export const familySaveOffer: SaveOfferTypeConfig = {
  noun: "a family member record",
  offerCriteria: `
- The user's recent message(s) say ANYTHING at all about an identifiable family member (or close-family figure: in-law, godparent, neighbour treated like family).
- "Identifiable" means: a name, OR a relation that is unambiguous in context (e.g. "Mum", "my brother") given the conversation and the EXISTING FAMILY MEMBERS section, OR an existing entry the user is clearly continuing to talk about.
- ANY snippet counts: a fact (name, age, where they live, hobby, work), an anecdote ("we had coffee on Sunday"), a feeling about them, a small detail ("she always wears blue") — they ALL go in the record as bullets. Family Tree saves SILENTLY in the background and accumulates snippets over time. NEVER hold out for a "complete" or "consolidated" write-up.
- The USER'S LAST MESSAGE block may include an "${FAMILY_CONTEXT_HEADING}" section listing previously saved people. Match the current message against those entries by FIRST NAME (case-insensitive) or by unambiguous relation. If matched, treat the new snippet as an UPDATE and reuse the existing title verbatim so the doc upserts in place.`,
  doNotOffer: `
- The latest user turn doesn't reference any specific person at all (pure small talk, weather, a generic question).
- The user only asked the AI a question without sharing anything of their own this turn.
- The latest turn is verbatim already in the EXISTING FAMILY MEMBERS section — nothing new to add.`,
  examples: `
- Title: "Margaret — my sister-in-law" — Offer: "Saving Margaret's record in the background."
- Title: "Tom — grandson" — Offer: "Saving Tom's record in the background."
- Title: "Mum" — Offer: "Saving Mum's record in the background."`,
  structureGuidance: `
- IMPORTANT: build the cleanContent from what the USER has actually said — across the conversation history, the EXISTING FAMILY MEMBERS section (when present), and the latest message. The AI reply is conversational by design; do NOT mine it for facts.
- First line: a short intro sentence naming the person and their relation (e.g. "Margaret, my sister-in-law." or "Mum.").
- Then a blank line.
- Then "- " bullet lines, ~6–12 words each, ONE snippet per bullet. Cover whatever the user has actually shared: relationship, age or birthday, where they live, work, hobbies, personality, anecdotes ("Had coffee together on Sunday"), small habits, things the user feels about them.
- MERGE rule: if you matched an EXISTING FAMILY MEMBERS entry, INCLUDE every existing bullet from that entry verbatim, then APPEND new bullets for the snippet(s) from this turn. Never drop or rewrite existing bullets. Never lose detail across upserts.
- For suggestedTitle: REUSE the matched existing entry's title VERBATIM if found (case, dashes, everything — so the doc upserts cleanly). If new, format as "<Name> — <relation>", or just "<Relation>" if no name was given (e.g. "Mum").
- No greetings, no chat-style commentary, no follow-up question, no save offer in cleanContent.`,
};
