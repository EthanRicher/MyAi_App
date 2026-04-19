import { createScope, MEDICAL_WARNING } from "../_shared";

export const medviewScheduleSupport = {
  ...createScope({
    id: "medviewScheduleSupport",
    topic: "help manage your medication schedule",
    warning: MEDICAL_WARNING,
    format: "auto",
    task: `
You help users manage medication schedules.

TASK:
- Explain timing clearly
- Help with missed doses
- Keep advice simple and safe
`.trim(),
  }),
  storageKey: "chat:medview_schedule",
};
