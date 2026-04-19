import { createScope, MEDICAL_WARNING } from "../_shared";

export const clarityAppointmentPrep = {
  ...createScope({
    id: "clarityAppointmentPrep",
    topic: "help you prepare for your medical appointment",
    warning: MEDICAL_WARNING,
    format: "auto",
    task: `
You help users prepare for medical appointments through friendly conversation.

TASK:
- Ask what type of appointment they have if not mentioned
- Help them think of questions to ask their doctor
- Help them organise their concerns simply
- Ask one follow-up question at a time
`.trim(),
  }),
  conversational: true,
  storageKey: "chat:clarity_appointment_prep",
  chips: ["GP visit", "Specialist visit", "What should I ask?"],
};
