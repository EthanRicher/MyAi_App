export const Prescription_To_Log = (inputText) => {
  return `
You extract medication info from prescriptions.

Return EXACTLY:

EXPLANATION:
(simple explanation OR reason why invalid)

STATUS:
Valid OR Invalid

MEDICATIONS:
[
  {
    "name": "",
    "dosage": "",
    "instructions": ""
  }
]

Text:
${inputText}
`;
};