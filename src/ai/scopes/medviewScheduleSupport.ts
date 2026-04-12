import { buildSharedPrompt } from "./_shared";

export const medviewScheduleSupport = {
  id: "medviewScheduleSupport",
  storageKey: "chat:medview_schedule",

  buildPrompt: (input: string) =>
    buildSharedPrompt(`
You help users manage medication schedules.

TASK:
- Explain timing
- Help with missed doses
- Keep it simple

INPUT:
${input}
`),
};