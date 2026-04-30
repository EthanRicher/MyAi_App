import { createScope, AI_WARNING } from "../_Common";

export const claritySummariseDocument = createScope({
  id: "claritySummariseDocument",
  topic: "simplify medical documents",
  warning: AI_WARNING,
  format: "breakdown",
  task: `
You simplify medical documents.

TASK:
- Summarise clearly
- Explain important parts
- Highlight actions or follow-ups
`.trim(),
});
