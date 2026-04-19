import { createScope, MEDICAL_WARNING } from "../_shared";

export const clarityExplainMedication = {
  ...createScope({
    id: "clarityExplainMedication",
    topic: "explain medications in simple terms",
    warning: MEDICAL_WARNING,
    format: "auto",
    task: `
You explain medications to a patient.

TASK:
- Explain what the medication is for
- Explain how it is usually taken
- Mention common side effects

DO NOT:
- Change dosage
- Give medical instructions
`.trim(),
  }),
  storageKey: "chat:clarity_explain_medication",
  chips: ["What is this for?", "Side effects?", "When do I take it?"],
};
