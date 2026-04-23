import { AIScope } from "../../core/types";
import { buildSharedPrompt } from "../_shared";

export const medviewMedicationScan: AIScope = {
  id: "medviewMedicationScan",
  topic: "scan medication labels and prescriptions",
  responseFormat: "json",

  buildPhotoPrompt: (analysis: string) =>
    buildSharedPrompt(`
You extract medication info from a photo of a prescription or medication label.
The following is a visual analysis of the photo — use it as your source.

${analysis}

Extract the medication details below.

RULES:
- Do NOT guess
- Only extract what is clearly stated in the analysis above
- If missing, leave fields empty
- If not medication, mark invalid

DOSE:
- Extract the actual dose the patient should TAKE, not just the tablet strength
- If the prescription states a quantity AND a tablet strength, multiply them to get the real dose
  - Example: "take 1.5 tablets of 50mg" → dose is "75mg"
  - Example: "take 2 tablets of 100mg" → dose is "200mg"
  - Example: "take 1 tablet of 10mg" → dose is "10mg"
- If only a tablet strength is written with no quantity, extract it as-is
- If the dose cannot be determined, leave "dose" empty

TIMES:
- If frequency is stated but exact times are not written:
  - once daily = ["08:00"]
  - twice daily = ["06:00", "18:00"]
  - three times daily = ["06:00", "14:00", "22:00"]
  - four times daily = ["06:00", "12:00", "18:00", "22:00"]

DESCRIPTION:
- Only extract the actual written instructions
- Do not explain
- Keep it short and exact

Return only valid JSON:

{
  "status": "Valid",
  "explanation": "",
  "medications": [
    {
      "name": "",
      "dose": "",
      "description": "",
      "timesPerDay": 0,
      "times": []
    }
  ]
}

If invalid, return:

{
  "status": "Invalid",
  "explanation": "reason",
  "medications": []
}
`),

  buildPrompt: (text: string) =>
    buildSharedPrompt(`
You extract medication info from prescriptions or medication labels.

RULES:
- Do NOT guess
- Only extract what is clearly written
- If missing, leave fields empty
- If not medication, mark invalid
- Animal medication is valid for debugging

DOSE:
- Extract the actual dose the patient should TAKE, not just the tablet strength
- If the prescription states a quantity AND a tablet strength, multiply them to get the real dose
  - Example: "take 1.5 tablets of 50mg" → dose is "75mg"
  - Example: "take 2 tablets of 100mg" → dose is "200mg"
  - Example: "take 1 tablet of 10mg" → dose is "10mg"
- If only a tablet strength is written with no quantity, extract it as-is
- If the dose cannot be determined, leave "dose" empty

TIMES:
- If frequency is stated but exact times are not written:
  - once daily = ["08:00"]
  - twice daily = ["06:00", "18:00"]
  - three times daily = ["06:00", "14:00", "22:00"]
  - four times daily = ["06:00", "12:00", "18:00", "22:00"]

DESCRIPTION:
- Only extract the actual written instructions
- Do not explain
- Do not add extra information
- Keep it short and exact

Return only valid JSON in this exact shape:

{
  "status": "Valid",
  "explanation": "",
  "medications": [
    {
      "name": "",
      "dose": "",
      "description": "",
      "timesPerDay": 0,
      "times": []
    }
  ]
}

If invalid, return:

{
  "status": "Invalid",
  "explanation": "reason",
  "medications": []
}

Text:
${text}
`),

  mapOutput: (parsed: any) => {
    const med = parsed?.medications?.[0] || {};

    const times = Array.isArray(med?.times)
      ? med.times
          .map((time: any) => (typeof time === "string" ? time.trim() : ""))
          .filter(Boolean)
      : [];

    const timesPerDay =
      typeof med?.timesPerDay === "number" && med.timesPerDay > 0
        ? med.timesPerDay
        : times.length > 0
        ? times.length
        : 1;

    return {
      status: parsed?.status || "",
      explanation: parsed?.explanation || "",
      name: typeof med?.name === "string" ? med.name.trim() : "",
      dose: typeof med?.dose === "string" ? med.dose.trim() : "",
      description:
        typeof med?.description === "string" ? med.description.trim() : "",
      timesPerDay,
      times,
    };
  },
};
