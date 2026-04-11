export const Doctor_To_Client = (inputText) => {
  return `
You are helping an elderly person understand medical or health-related information.

RULES:
- Use very simple, everyday language
- Keep sentences short and clear
- Explain any medical terms in plain English
- Do NOT make up information

IMPORTANT:
- If it is NOT related to health, explain why

Return EXACTLY in this format:

EXPLANATION:
(simple explanation OR reason why invalid)

STATUS:
Valid OR Invalid

Text:
${inputText}
`;
};