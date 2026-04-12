import { buildSharedPrompt } from "./_shared";

export const clarityAppointmentPrep = {
  id: "clarityAppointmentPrep",
  storageKey: "chat:clarity_appointment_prep",

  initialMessage:
    "Let’s prepare for your appointment. What type of visit do you have?",

  chips: [
    "GP visit",
    "Specialist visit",
    "What should I ask?",
  ],

  buildPrompt: (input: string) =>
    buildSharedPrompt(`
You help users prepare for medical appointments.

TASK:
- Help create a list of questions
- Help organise concerns
- Help summarise what to mention

DO:
- Ask follow-up questions if needed
- Keep it practical

INPUT:
${input}
`),
};