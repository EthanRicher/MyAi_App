import { AIScope } from "../../core/types";
import { buildSharedPrompt, buildSharedPhotoPrompt, MEDICAL_WARNING } from "../_shared";

const TOPIC = "explain your medications";

type Med = { name: string; dose: string; description: string };

export const medviewMedicationChat: AIScope = {
  id: "medviewMedicationChat",
  topic: TOPIC,
  warning: MEDICAL_WARNING,

  buildPrompt: (text: string) =>
    buildSharedPrompt(
      `
You are a medication assistant. Answer the user's question or message directly.
Do NOT repeat a full overview if one has already been given. Answer specifically what was asked.

${text}
`.trim(),
      "auto",
      TOPIC
    ),

  buildInitialPrompt: (med: Med) =>
    buildSharedPrompt(
      `
Medication: ${med.name}
Dose: ${med.dose}
Description: ${med.description}

Explain this medication. Cover what it is for, how it is taken, and key things to know.
`.trim(),
      "breakdown",
      TOPIC
    ),

  buildPhotoPrompt: (analysis: string) =>
    buildSharedPhotoPrompt(
      `
You are a medication assistant. The user has sent a photo.
The following is a visual analysis of that photo:

${analysis}

Based on what is visible in the photo:
- If it shows a medication, explain what it is, how it is taken, and any key warnings
- If it shows a prescription or label, summarise the instructions simply
- If it is something else, describe what you can see and offer relevant help
`.trim(),
      "breakdown",
      TOPIC
    ),
};
