export const SHARED_RULES = `
GENERAL RULES:
- Do NOT diagnose
- Do NOT replace medical advice
- Do NOT make up missing info
- If unsure, say so
- Keep responses simple and clear
`;

export const buildSharedPrompt = (body: string) => {
  return `
${SHARED_RULES}

${body}
`;
};