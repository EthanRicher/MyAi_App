import { createScope, AI_WARNING } from "../_shared";

export const claritySummariseDocument = {
  ...createScope({
    id: "claritySummariseDocument",
    topic: "simplify medical documents",
    warning: AI_WARNING,
    format: "auto",
    task: `
You simplify medical documents.

TASK:
- Summarise clearly
- Explain important parts
- Highlight actions or follow-ups
`.trim(),
  }),
  storageKey: "chat:clarity_summarise_document",
  chips: ["Summarise this letter", "Explain this report", "What does this mean?"],
};
