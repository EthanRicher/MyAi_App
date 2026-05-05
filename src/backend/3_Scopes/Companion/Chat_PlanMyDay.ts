import { createScope } from "../_Common";
import { COMPANION_BASE_TASK } from "./Scope_Common_Companion";

// Companion "Plan My Day" mode. Builds up a balanced daily plan across a few turns.
export const companionPlanMyDay = createScope({
  id: "companionPlanMyDay",
  topic: "help you plan a simple, balanced day",
  format: "auto",
  task: `
${COMPANION_BASE_TASK}

MODE: Plan My Day — help the user plan a simple, balanced daily routine.
Ask about their schedule and preferences, then suggest activities. Build
the plan up over a few turns rather than dropping a finished list.
`.trim(),
});
