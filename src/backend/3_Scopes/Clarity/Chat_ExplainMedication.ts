import { createScope, MEDICAL_WARNING } from "../_Common";

// Clarity "Explain Medication" scope. Plain-English overview of what a medication is and how it works.
export const clarityExplainMedication = createScope({
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
});
