import { buildSharedPrompt } from "./_shared";

export const clarityDoctorExplained = {
  id: "clarityDoctorExplained",
  storageKey: "chat:clarity_doctor_explained",
  topic: "explain what your doctor said in simple terms",
  warning: "This is not a substitute for professional medical advice. Always follow your doctor's guidance.",

  initialMessage:
    "You can paste or record what your doctor said. I will explain it in simple terms.",

  chips: [
    "Explain what my doctor said",
    "Summarise this visit",
    "What should I do next?",
  ],

  buildPrompt: (input: string) =>
    buildSharedPrompt(`
You explain doctor conversations.

TASK:
- Simplify what the doctor said
- Highlight key points
- Explain medical terms
- Suggest what the patient should remember

INPUT:
${input}
`, "breakdown", "explain what your doctor said in simple terms"),
};