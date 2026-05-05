import { createScope, MEDICAL_WARNING } from "../_Common";

// Clarity "Doctor Explained" scope. Translates jargon-heavy doctor talk into plain English.
export const clarityDoctorExplained = createScope({
  id: "clarityDoctorExplained",
  topic: "explain what your doctor said in simple terms",
  warning: MEDICAL_WARNING,
  format: "auto",
  task: `
You explain doctor conversations.

TASK:
- Simplify what the doctor said
- Highlight key points
- Explain medical terms
- Suggest what the patient should remember
`.trim(),
});
