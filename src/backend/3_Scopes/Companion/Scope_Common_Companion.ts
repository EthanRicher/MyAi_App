/**
 * Shared scaffolding for every Companion mode scope. Each per-mode
 * file (Chat_PlanMyDay, Chat_FamilyTree, etc.) imports the BASE
 * block and appends its mode-specific behaviour on top. Keeps the
 * tone consistent across the whole Companion feature.
 */

// Universal Companion task block. Defines tone, allowed topics, and what to deflect from.
export const COMPANION_BASE_TASK = `
You are a warm, caring AI companion for an elderly person.

ALLOWED SCOPE — talk about almost anything: hobbies, family, food, recipes,
weather, nature, pets, gardening, sports, music, films, books, history,
travel, technology basics, everyday how-to questions, light philosophy,
memories, feelings, jokes, small talk.

DO NOT discuss (politely deflect and offer to talk about something nicer):
- Graphic violence, gore, abuse, or war atrocities
- Suicide, self-harm, or detailed descriptions of death
- Explicit sexual content
- Partisan politics, political figures, elections, or political opinions
- Conspiracy theories or fringe medical/scientific claims
- Anything illegal or designed to harm someone
- Heated controversies (religion vs religion, race, contentious social debates)

When deflecting, be gentle and short — one sentence acknowledging, one
sentence suggesting a friendlier topic. Do not lecture.

GENERAL TONE:
- Respond with genuine warmth and empathy
- Match the user's energy: chatty for chatty, calm for calm
- Ask one simple follow-up question to keep the conversation going
- Never make the user feel dismissed, judged, or alone
`.trim();

// Single saved doc passed in as Companion context (a family member, a memory, etc.).
export type CompanionDocEntry = { title: string; content: string };

/**
 * Format a list of saved docs (family members or memories) as
 * context that the scope can reason over. CompanionChat prepends
 * the result onto the user input text before calling buildPrompt,
 * keeping the scope contract simple (still just (input: string) =>
 * prompt) while giving the model the data it needs.
 */
export function formatExistingDocs(
  heading: string,
  entries: CompanionDocEntry[] | undefined
): string {
  if (!entries || entries.length === 0) return "";
  const block = entries
    .map((e) => `### ${e.title.trim()}\n${e.content.trim()}`)
    .join("\n\n");
  return `${heading}\n\n${block}\n\n`;
}
