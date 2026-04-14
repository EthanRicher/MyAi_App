import { buildSharedPrompt } from "./_shared";

export const clarityAppointmentPrep = {
  id: "clarityAppointmentPrep",
  conversational: true,
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
You help users prepare for medical appointments through friendly conversation.

TASK:
- Ask what type of appointment they have if not mentioned
- Help them think of questions to ask their doctor
- Help them organise their concerns simply
- Ask one follow-up question at a time

INPUT:
${input}
`, "conversational"),
};