import { AIScope } from "../core/types";
import { buildSharedPrompt } from "./_shared";

export const medviewMedicationChat: AIScope = {
  id: "medviewMedicationChat",

  buildPrompt: (text: string) =>
    buildSharedPrompt(`
You answer questions about a medication.

TASK:
- Explain what the medication is for
- Explain how it is typically taken (in general terms)
- Mention common side effects simply
- Keep answers short and easy to understand

Text:
${text}
`),
};