import { buildSharedPrompt } from "./_shared";

export const clarityExplainMedication = {
  id: "clarityExplainMedication",
  storageKey: "chat:clarity_explain_medication",

  initialMessage:
    "Tell me the name of your medication and I will explain it simply.",

  chips: [
    "What is this for?",
    "Side effects?",
    "When do I take it?",
  ],

  buildPrompt: (input: string) =>
    buildSharedPrompt(`
You explain medications to a patient.

TASK:
- Explain what the medication is for
- Explain how it is usually taken
- Mention common side effects

DO NOT:
- Change dosage
- Give medical instructions

INPUT:
${input}
`),
};