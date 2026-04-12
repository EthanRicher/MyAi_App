import { buildSharedPrompt } from "./_shared";

export const claritySummariseDocument = {
  id: "claritySummariseDocument",
  storageKey: "chat:clarity_summarise_document",

  initialMessage:
    "Paste your document text and I will summarise it in plain English.",

  chips: [
    "Summarise this letter",
    "Explain this report",
    "What does this mean?",
  ],

  buildPrompt: (input: string) =>
    buildSharedPrompt(`
You simplify medical documents.

TASK:
- Summarise clearly
- Explain important parts
- Highlight actions or follow-ups

INPUT:
${input}
`),
};