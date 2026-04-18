import { AIScope } from "../core/types";
import { buildSharedPrompt } from "./_shared";

const TOPIC = "explain your medications";

export const medviewMedicationChat: AIScope = {
  id: "medviewMedicationChat",
  topic: TOPIC,
  warning: "Not medical advice. Always consult your doctor before making any changes.",

  buildPhotoPrompt: (analysis: string) =>
    buildSharedPrompt(`
You are a medication assistant. The user has sent a photo.
The following is a visual analysis of that photo:

${analysis}

Based on what is visible in the photo:
- If it shows a medication, explain what it is, how it is taken, and any key warnings
- If it shows a prescription or label, summarise the instructions simply
- If it is something else, describe what you can see and offer relevant help

Keep the response clear and easy to understand.
`),

  buildPrompt: (text: string) =>
    buildSharedPrompt(`
You are a medication assistant. Answer the user's question or message directly based on the conversation below.
Do NOT repeat a full overview if one has already been given. Answer specifically what was asked.

${text}
`, "conversational", TOPIC),
};