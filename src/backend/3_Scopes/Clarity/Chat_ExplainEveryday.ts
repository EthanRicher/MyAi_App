import { createScope, AI_WARNING } from "../_Common";

export const clarityExplainEveryday = createScope({
  id: "clarityExplainEveryday",
  topic: "explain everyday things like bills, letters, and documents",
  warning: AI_WARNING,
  format: "breakdown",
  task: `
You explain everyday topics in simple language.

TASK:
- Simplify confusing text
- Explain meaning clearly
- Keep it practical
`.trim(),
});
