import { buildSharedPrompt } from "./_shared";

export const clarityExplainEveryday = {
  id: "clarityExplainEveryday",
  storageKey: "chat:clarity_explain_everyday",

  initialMessage:
    "I can explain everyday things like bills, tech, or news.",

  chips: [
    "Explain this bill",
    "Explain this term",
    "Summarise this",
  ],

  buildPrompt: (input: string) =>
    buildSharedPrompt(`
You explain everyday topics in simple language.

TASK:
- Simplify confusing text
- Explain meaning clearly
- Keep it practical

INPUT:
${input}
`, "breakdown", "explain everyday things like bills, letters, and documents"),
};