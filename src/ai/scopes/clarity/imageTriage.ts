import { buildSharedPrompt } from "../_shared";

export const clarityImageTriage = {
  id: "clarityImageTriage",
  storageKey: "chat:clarity_image_triage",

  initialMessage:
    "Send a photo and I will work out what it likely is and explain it simply.",

  chips: [
    "Explain this photo",
    "What kind of document is this?",
    "Summarise this image text",
  ],

  buildPrompt: (input: string) =>
    buildSharedPrompt(`
You receive OCR text extracted from a user photo.

TASK:
- Work out what the image most likely is
- Examples: medication label, prescription, appointment note, medical letter, bill, form, general document
- Explain it in simple language
- If it looks medical, focus on what matters most
- If it is unclear, say what can be read and what is uncertain
- If the OCR is poor, tell the user the photo may need to be retaken
- Do not mention OCR unless the text is clearly incomplete or messy
- Keep it practical and easy to understand

INPUT:
${input}
`),
};
